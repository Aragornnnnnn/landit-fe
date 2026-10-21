// 온보딩 초대 코드 단계 — 친구에게 받은 8자리를 넣으면 확인까지 저절로 하고, 한 번 눌러 등록한다.
// 첫 결제보다 앞에 있어야 결제 보상까지 받는다(등록 전 결제는 소급되지 않는다)
'use client';

import { useState } from 'react';
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
import { formatWon } from '@/shared/lib/won';
import { reportWarning } from '@/shared/monitoring/report';
import { Button } from '@/shared/ui/Button';
import { showToast } from '@/shared/ui/toast';

const NOT_FOUND_MESSAGE = '복사한 내용에서 초대 코드를 못 찾았어요';
const POLICY_CHANGED_MESSAGE = '보상 조건이 바뀌었어요. 다시 확인해 주세요';

type InputMethod = 'paste' | 'typed';

// 칸 아래 안내 — 못 찾음·등록 실패는 빨간 줄로 확인 결과를 덮고, 조건이 바뀐 건 새 조건 아래에 덧붙인다
type Notice = { message: string; blocking: boolean };

export const ReferralStep = ({
  signupWon,
  onDone,
}: {
  // 지금 조건으로 초대받은 사람이 가입 때 받는 금액 — 0이면 금액 없이 묻는다
  signupWon: number;
  onDone: () => void;
}) => {
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<InputMethod>('typed');
  // 코드를 고치면 걷는다
  const [notice, setNotice] = useState<Notice | null>(null);
  const preview = useReferralPreviewQuery(code);
  const register = useRegisterReferralCodeMutation();
  const skip = useSkipReferralMutation();

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

  const submitCode = (policyVersion: number) =>
    register.mutate(
      { code, policyVersion },
      {
        onSuccess: () => {
          track(EVENTS.REFERRAL_CODE_REGISTERED, { method });
          onDone();
        },
        onError: (error) => {
          const failure = referralFailureOf(error);
          if (failure.kind === 'move_on') {
            if (failure.notice) showToast(failure.notice);
            return onDone();
          }
          if (failure.kind === 'recheck') {
            setNotice({ message: POLICY_CHANGED_MESSAGE, blocking: false });
            preview.refetch();
            return;
          }
          if (!failure.expected) reportWarning(error);
          setNotice({ message: failure.message, blocking: true });
        },
      },
    );

  const skipCode = () => {
    track(EVENTS.REFERRAL_CODE_SKIPPED);
    skip.mutate();
    onDone();
  };

  const status = statusOf(preview, notice);
  // 조건을 다시 받는 동안은 누르지 못한다 — 옛 정책 버전으로 보내면 또 거절된다
  const canSubmit = status.tone === 'ok' && !preview.isFetching;

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.18] font-black tracking-normal break-keep">
        초대 코드가 있나요?
      </h1>
      <p className="mt-4 text-xl font-bold break-keep text-muted-foreground">
        {signupWon > 0
          ? `코드를 넣으면 ${formatWon(signupWon)}을 적립해 드려요`
          : '친구에게 받은 8자리 코드를 넣어 주세요'}
      </p>

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
        {status.tone !== 'ok' && (
          <Button
            variant="ghost"
            size="md"
            className="mt-5"
            onClick={pasteFromClipboard}
          >
            복사한 메시지 붙여넣기
          </Button>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 pt-4">
        <button
          type="button"
          onClick={skipCode}
          // 등록을 보내는 중에 건너뛰면 둘이 같이 나간다
          disabled={register.isPending}
          className="text-[15px] font-medium text-muted-foreground underline underline-offset-4 disabled:opacity-45"
        >
          초대 코드가 없어요
        </button>
        <Button
          disabled={!canSubmit}
          loading={register.isPending}
          onClick={() => preview.data && submitCode(preview.data.policyVersion)}
        >
          등록하고 계속할게요
        </Button>
      </div>
    </div>
  );
};

type Status =
  | { tone: 'idle'; checking: boolean }
  | { tone: 'error'; message: string }
  | {
      tone: 'ok';
      signupWon: number;
      purchaseWon: number;
      notice: string | null;
    };

// 칸 아래 상태 하나로 모은다 — 막는 안내(못 찾음·등록 실패)와 다시 받은 확인의 실패가 확인 결과보다 앞선다
const statusOf = (
  preview: ReturnType<typeof useReferralPreviewQuery>,
  notice: Notice | null,
): Status => {
  if (notice?.blocking) return { tone: 'error', message: notice.message };
  const failure = preview.error ? referralFailureOf(preview.error) : null;
  // 다시 받다 실패했으면(그새 초대 보상이 꺼졌다 등) 남아 있는 옛 결과를 믿지 않는다
  if (failure?.kind === 'message' && (preview.isRefetchError || !preview.data))
    return { tone: 'error', message: failure.message };
  if (preview.data)
    return {
      tone: 'ok',
      signupWon: inviteeWonOf(preview.data.signup),
      purchaseWon: inviteeWonOf(preview.data.purchase),
      notice: notice?.message ?? null,
    };
  return { tone: 'idle', checking: preview.isFetching };
};

const StatusLines = ({ status }: { status: Status }) => {
  if (status.tone === 'error')
    return (
      <p className="text-sm font-bold text-destructive">{status.message}</p>
    );
  if (status.tone === 'idle')
    return status.checking ? (
      <p className="text-sm font-bold text-muted-foreground">확인하고 있어요</p>
    ) : null;
  return (
    <>
      <p className="text-sm font-bold text-success">
        {status.signupWon > 0
          ? `✓ 확인됐어요 · 지금 등록하면 ${formatWon(status.signupWon)}`
          : '✓ 확인됐어요'}
      </p>
      {status.purchaseWon > 0 && (
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          프리미엄을 시작하면 {formatWon(status.purchaseWon)} 더
        </p>
      )}
      {status.notice && (
        <p className="mt-1 text-[13px] font-bold text-destructive">
          {status.notice}
        </p>
      )}
    </>
  );
};
