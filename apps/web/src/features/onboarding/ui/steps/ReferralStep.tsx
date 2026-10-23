// 온보딩 초대 코드 단계 — 친구에게 받은 8자리를 넣으면 확인과 등록까지 누를 것 없이 저절로 한다.
// 첫 결제보다 앞에 있어야 결제 보상까지 받는다(등록 전 결제는 소급되지 않는다)
'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

// 초대 코드 확인·등록은 referral feature가 정본이라 온보딩 단계가 가로 import한다
import { inviteeWonOf } from '@/features/referral/model/invitee-reward';
import { findReferralCode } from '@/features/referral/model/referral-code';
import { referralFailureOf } from '@/features/referral/model/referral-failure';
import { useReferralPreviewQuery } from '@/features/referral/model/useReferralPreviewQuery';
import { useRegisterReferralCodeMutation } from '@/features/referral/model/useRegisterReferralCodeMutation';
import { useSkipReferralMutation } from '@/features/referral/model/useSkipReferralMutation';
import { ReferralCodeInput } from '@/features/referral/ui/ReferralCodeInput';
import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { formatWon } from '@/shared/lib/won';
import { reportWarning } from '@/shared/monitoring/report';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { ClipboardPasteIcon } from '@/shared/ui/Icons';
import { showToast } from '@/shared/ui/toast';

import { ReferralAsk } from './ReferralAsk';
import { ReferralRewardMoment } from './ReferralRewardMoment';

const NOT_FOUND_MESSAGE = '복사한 내용에서 초대 코드를 못 찾았어요';
const POLICY_CHANGED_MESSAGE = '보상 조건이 바뀌었어요. 다시 확인해 주세요';
// 초록으로 바뀐 칸을 알아볼 틈 — 등록이 더 빨리 끝나도 이만큼은 「확인됐어요」를 보여 주고 적립 연출로 넘어간다
const VERIFIED_HOLD_MS = 400;

type InputMethod = 'paste' | 'typed';

// 먼저 초대 받고 왔는지 묻고(ask), 「네」면 코드를 받는다(enter). 헤더 뒤로가기가 enter → ask로 되돌리게 플로우가 쥔다
export type ReferralPhase = 'ask' | 'enter';

export const ReferralStep = ({
  phase,
  onEnter,
  signupWon,
  onDone,
}: {
  phase: ReferralPhase;
  onEnter: () => void;
  // 지금 조건으로 초대받은 사람이 가입 때 받는 금액 — 0이면 금액 없이 묻는다
  signupWon: number;
  onDone: () => void;
}) => {
  const skip = useSkipReferralMutation();
  // 서버에 영구로 남는 요청이라 한 번만 보낸다 — 화면이 빠져나가는 동안 한 번 더 눌려도 다시 보내지 않는다
  const skipped = useRef(false);

  // 어디서 건너뛰었는지 남긴다 — 질문에서 「아니요」인지, 코드를 찾다 포기했는지가 갈린다
  const skipCode = (from: 'ask' | 'entry') => {
    if (skipped.current) return;
    skipped.current = true;
    track(EVENTS.REFERRAL_CODE_SKIPPED, { from });
    skip.mutate();
    onDone();
  };

  if (phase === 'ask')
    return <ReferralAsk onYes={onEnter} onNo={() => skipCode('ask')} />;
  return (
    <CodeEntry
      signupWon={signupWon}
      onSkip={() => skipCode('entry')}
      onDone={onDone}
    />
  );
};

// 칸 아래 안내 — 못 찾음·등록 실패는 빨간 줄로 확인 결과를 덮고, 조건이 바뀐 건 새 조건 아래에 덧붙인다
type Notice = { message: string; blocking: boolean };

const CodeEntry = ({
  signupWon,
  onSkip,
  onDone,
}: {
  signupWon: number;
  onSkip: () => void;
  onDone: () => void;
}) => {
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<InputMethod>('typed');
  // 코드를 고치면 걷는다
  const [notice, setNotice] = useState<Notice | null>(null);
  const preview = useReferralPreviewQuery(code);
  const register = useRegisterReferralCodeMutation();

  const enterCode = (next: string, via: InputMethod) => {
    setCode(next);
    setMethod(via);
    setNotice(null);
  };

  const pasteCode = (found: string | null) => {
    if (found) return enterCode(found, 'paste');
    setNotice({ message: NOT_FOUND_MESSAGE, blocking: true });
  };

  // 칸을 길게 누르지 않아도 되게 버튼으로도 읽는다 — 화면에 들어오자마자 몰래 읽지는 않는다(iOS는 읽을 때마다 허용을 묻는다)
  const pasteFromClipboard = async () => {
    try {
      pasteCode(findReferralCode(await navigator.clipboard.readText()));
    } catch {
      showToast('칸을 길게 눌러 붙여넣어 주세요');
    }
  };

  // 건너뛰기는 서버에 영구로 남아 되돌릴 수 없다 — 바로 넘기지 않고 코드 모양을 보여 주며 한 번 더 묻는다
  const [askingSkip, setAskingSkip] = useState(false);
  // 등록되면 그 조건으로 받은 금액을 띄운다 — 연출이 끝나야 다음 단계로 간다
  const [credited, setCredited] = useState<{
    won: number;
    holdMs: number;
  } | null>(null);

  // 거절된 코드·조건 — 같은 걸 다시 넣으면 보내지 않고 그 이유를 그대로 보여 준다(캐시된 확인 결과로 「확인됐어요」가 다시 뜨지 않게)
  const [rejected, setRejected] = useState<Record<string, string>>({});
  // 조건이 바뀌어 다시 보내는 건 한 번만 — 서버가 같은 버전을 다시 줘도 무한히 돌지 않는다
  const rechecked = useRef(false);
  // 다시 보내도 되는 실패마다 하나씩 올린다 — 같은 코드·조건이어도 보낼 키가 달라져 다시 나간다
  const [attempt, setAttempt] = useState(0);
  // 건너뛰기를 고른 뒤에는 무엇도 보내지 않는다 — 화면이 빠지기 전 확인이 끝나도 등록이 따라 나가지 않게
  const [leaving, setLeaving] = useState(false);

  const submitCode = (key: string, policyVersion: number, won: number) =>
    register.mutate(
      { code, policyVersion },
      {
        onSuccess: () => {
          track(EVENTS.REFERRAL_CODE_REGISTERED, { method });
          const shown = performance.now() - verifiedAt.current;
          setCredited({
            won,
            holdMs: Math.max(0, VERIFIED_HOLD_MS - shown),
          });
        },
        onError: (error) => {
          const failure = referralFailureOf(error);
          if (failure.kind === 'move_on') {
            if (failure.notice) showToast(failure.notice);
            return onDone();
          }
          if (failure.kind === 'recheck' && !rechecked.current) {
            // 새 조건을 받으면 아래 effect가 그 버전으로 한 번 더 보낸다
            rechecked.current = true;
            setAttempt((count) => count + 1);
            setNotice({ message: POLICY_CHANGED_MESSAGE, blocking: false });
            preview.refetch();
            return;
          }
          if (failure.kind === 'recheck') {
            setNotice({ message: POLICY_CHANGED_MESSAGE, blocking: true });
            setAttempt((count) => count + 1);
            return;
          }
          if (!failure.expected) reportWarning(error);
          // 틀린 코드처럼 다시 보내도 같은 거절만 기억한다 — 네트워크·횟수 제한은 같은 코드를 다시 넣으면 다시 보낸다
          if (failure.retryable) setAttempt((count) => count + 1);
          else setRejected((prev) => ({ ...prev, [key]: failure.message }));
          setNotice({ message: failure.message, blocking: true });
        },
      },
    );

  const previewKey = preview.data
    ? `${code}:${preview.data.policyVersion}`
    : null;
  const status = statusOf(
    preview,
    notice,
    previewKey ? rejected[previewKey] : undefined,
  );
  // 확인이 끝나면 누를 것 없이 바로 등록한다. 같은 코드·같은 조건은 한 번만 보낸다 — 거절된 걸 또 보내지 않는다
  const sentKey = useRef<string | null>(null);
  const verifiedAt = useRef(0);
  const ready = status.tone === 'ok' && !preview.isFetching;
  // 건너뛸지 묻는 시트가 떠 있는 동안은 보내지 않는다 — 시트 뒤에서 등록과 건너뛰기가 같이 나가지 않게
  const readyKey =
    ready && !askingSkip && !leaving ? `${previewKey}#${attempt}` : null;
  const submitReady = useEffectEvent(() => {
    if (!preview.data || !previewKey) return;
    haptic('light');
    verifiedAt.current = performance.now();
    submitCode(
      previewKey,
      preview.data.policyVersion,
      inviteeWonOf(preview.data.signup),
    );
  });
  useEffect(() => {
    if (readyKey === null || readyKey === sentKey.current) return;
    sentKey.current = readyKey;
    submitReady();
  }, [readyKey]);

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.18] font-black tracking-normal break-keep">
        친구에게 받은
        <br />
        초대 코드를 넣어 주세요
      </h1>
      {/* 「네, 초대 코드가 있어요」를 고른 사람만 오는 화면이라 여기서는 받을 돈을 말해도 된다 */}
      {signupWon > 0 && (
        <p className="mt-4 text-xl font-bold break-keep text-muted-foreground">
          등록하면 {formatWon(signupWon)}을 적립해 드려요
        </p>
      )}

      <div className="mt-8">
        <ReferralCodeInput
          value={code}
          tone={status.tone}
          onType={(typed) => enterCode(typed, 'typed')}
          onPaste={pasteCode}
        />
        <div role="status" aria-live="polite" className="mt-3.5 text-center">
          <StatusLines status={status} />
        </div>
        {status.tone !== 'ok' && status.tone !== 'checking' && (
          // 칸을 길게 눌러도 붙여넣을 수 있어 보조 수단이다 — 화면을 차지하지 않게 작은 알약으로 둔다
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="mx-auto mt-5 flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-foreground transition-transform active:scale-95"
          >
            <ClipboardPasteIcon size={16} />
            붙여넣기
          </button>
        )}
        {/* 코드 칸 바로 아래 둔다 — 빈 화면 맨 아래 혼자 있으면 찾기 어렵고 어색하다 */}
        <button
          type="button"
          onClick={() => setAskingSkip(true)}
          className="mx-auto mt-6 block text-[15px] font-medium text-muted-foreground underline underline-offset-4"
        >
          초대 코드가 없어요
        </button>
      </div>

      <ConfirmSheet
        open={askingSkip}
        title="친구에게 받은 메시지를 확인해 보세요"
        description="건너뛰면 나중에는 코드를 넣을 수 없어요"
        confirmLabel="코드 없이 계속할게요"
        continueLabel="코드 찾아볼게요"
        onConfirm={() => {
          setLeaving(true);
          setAskingSkip(false);
          onSkip();
        }}
        onClose={() => setAskingSkip(false)}
        extra={<CodeSample />}
      />

      {/* 등록을 보내는 동안 화면을 투명하게 덮는다 — 그새 코드를 바꾸거나 건너뛰거나 뒤로 가 결과를 놓치지 않게 */}
      {register.isPending && <div aria-hidden className="fixed inset-0 z-50" />}

      {credited && (
        <ReferralRewardMoment
          won={credited.won}
          holdMs={credited.holdMs}
          onDone={onDone}
        />
      )}
    </div>
  );
};

type Status =
  | { tone: 'idle' }
  | { tone: 'checking' }
  | { tone: 'error'; message: string }
  | { tone: 'ok'; notice: string | null };

// 칸 아래 상태 하나로 모은다 — 막는 안내(못 찾음·등록 실패)와 다시 받은 확인의 실패가 확인 결과보다 앞선다
const statusOf = (
  preview: ReturnType<typeof useReferralPreviewQuery>,
  notice: Notice | null,
  // 이 코드·조건으로 이미 거절당한 이유
  rejectedMessage: string | undefined,
): Status => {
  if (notice?.blocking) return { tone: 'error', message: notice.message };
  if (rejectedMessage) return { tone: 'error', message: rejectedMessage };
  // 다시 받다 실패했으면(그새 초대 보상이 꺼졌다 등) 남아 있는 옛 결과를 믿지 않는다
  if (preview.error && (preview.isRefetchError || !preview.data))
    return { tone: 'error', message: previewFailureMessageOf(preview.error) };
  if (preview.data) return { tone: 'ok', notice: notice?.message ?? null };
  return preview.isFetching ? { tone: 'checking' } : { tone: 'idle' };
};

// 확인 단계에서는 넘어갈 곳이 없어 무슨 실패든 칸 아래에 적는다 — 아무 안내 없이 멈춘 화면이 되지 않게
const previewFailureMessageOf = (error: unknown) => {
  const failure = referralFailureOf(error);
  if (failure.kind === 'message') return failure.message;
  if (failure.kind === 'move_on')
    return failure.notice ?? '이미 초대 코드를 등록했어요';
  return POLICY_CHANGED_MESSAGE;
};

const StatusLines = ({ status }: { status: Status }) => {
  if (status.tone === 'idle') return null;
  if (status.tone === 'error')
    return (
      <p className="text-base font-bold text-destructive">{status.message}</p>
    );
  if (status.tone === 'checking')
    return (
      <p className="text-base font-bold text-muted-foreground">
        확인하고 있어요
      </p>
    );
  return (
    <>
      <p className="inline-flex items-center gap-1.5 text-base font-bold text-success">
        <CheckCircle />
        확인됐어요
      </p>
      {status.notice && (
        <p className="mt-1 text-[13px] font-bold text-destructive">
          {status.notice}
        </p>
      )}
    </>
  );
};

// 친구가 보낸 메시지에서 코드가 어떻게 생겼는지 — 공유 문구의 「초대 코드:」 줄과 같은 모양이다
const CodeSample = () => (
  <div className="rounded-2xl bg-secondary px-4 py-3.5">
    <p className="text-[13px] font-medium text-muted-foreground">
      이렇게 생긴 8자리 코드예요
    </p>
    <p className="mt-1 text-base font-bold text-foreground">
      초대 코드: K7QM3XPA
    </p>
  </div>
);

// 초록 동그라미 안 흰 체크 — 동그라미가 커지고 체크가 그려진다(알람 등록 완료와 같은 모양, 색만 초록)
const CheckCircle = () => (
  <svg
    viewBox="0 0 32 32"
    className="size-5 animate-[check-in_0.4s_ease-out_both]"
    aria-hidden
  >
    <circle cx="16" cy="16" r="16" className="fill-success" />
    <path
      d="M9.5 16.5l4.5 4.5 8.5-9"
      fill="none"
      className="stroke-success-foreground"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
