// 온보딩 초대 코드 단계 — 친구에게 받은 8자리를 넣으면 확인까지 저절로 하고, 한 번 눌러 등록한다.
// 첫 결제보다 앞에 있어야 결제 보상까지 받는다(등록 전 결제는 소급되지 않는다)
'use client';

import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// 초대 코드 확인·등록은 referral feature가 정본이라 온보딩 단계가 가로 import한다
import {
  registerReferralCode,
  skipReferralRegistration,
} from '@/features/referral/api/referral';
import { inviteeWonOf } from '@/features/referral/model/invitee-reward';
import { referralKeys } from '@/features/referral/model/keys';
import { findReferralCode } from '@/features/referral/model/referral-code';
import { registrationFailureOf } from '@/features/referral/model/registration-error';
import { useReferralPreviewQuery } from '@/features/referral/model/useReferralPreviewQuery';
import { ReferralCodeInput } from '@/features/referral/ui/ReferralCodeInput';
import { track } from '@/shared/analytics';
import { formatWon } from '@/shared/lib/won';
import { reportWarning } from '@/shared/monitoring/report';
import { Button } from '@/shared/ui/Button';
import { showToast } from '@/shared/ui/toast';

const NOT_FOUND_MESSAGE = '복사한 내용에서 초대 코드를 못 찾았어요';
const POLICY_CHANGED_MESSAGE = '보상 조건이 바뀌었어요. 다시 확인해 주세요';

type InputMethod = 'paste' | 'typed';

export const ReferralStep = ({
  signupWon,
  onDone,
}: {
  // 지금 조건으로 초대받은 사람이 가입 때 받는 금액 — 0이면 금액 없이 묻는다
  signupWon: number;
  onDone: () => void;
}) => {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<InputMethod>('typed');
  // 확인 결과와 별개로 칸 아래에 띄울 안내 — 못 찾음·등록 실패. 코드를 고치면 걷는다
  const [notice, setNotice] = useState<string | null>(null);
  const preview = useReferralPreviewQuery(code);

  const register = useMutation({
    mutationFn: (body: { code: string; policyVersion: number }) =>
      registerReferralCode(body),
    onSuccess: () => {
      track(EVENTS.REFERRAL_CODE_REGISTERED, { method });
      queryClient.invalidateQueries({ queryKey: referralKeys.all });
      onDone();
    },
    onError: (error) => {
      const failure = registrationFailureOf(error);
      if (failure.kind === 'move_on') return onDone();
      if (failure.kind === 'recheck') {
        setNotice(POLICY_CHANGED_MESSAGE);
        preview.refetch();
        return;
      }
      reportWarning(error);
      setNotice(failure.message);
    },
  });

  const enterCode = (next: string, via: InputMethod) => {
    setCode(next);
    setMethod(via);
    setNotice(null);
  };

  const pasteCode = (found: string | null) => {
    if (found) return enterCode(found, 'paste');
    setNotice(NOT_FOUND_MESSAGE);
  };

  // 칸을 길게 누르지 않아도 되게 버튼으로도 읽는다 — 화면에 들어오자마자 몰래 읽지는 않는다(iOS는 읽을 때마다 허용을 묻는다)
  const pasteFromClipboard = async () => {
    try {
      pasteCode(findReferralCode(await navigator.clipboard.readText()));
    } catch {
      showToast('칸을 길게 눌러 붙여넣어 주세요');
    }
  };

  const skip = () => {
    track(EVENTS.REFERRAL_CODE_SKIPPED);
    // 서버가 건너뛴 걸 알아야 다음에 다시 묻지 않는다. 실패해도 온보딩은 막지 않는다 — 다음 온보딩에서 한 번 더 물을 뿐이다
    skipReferralRegistration().catch(reportWarning);
    onDone();
  };

  const status = statusOf(preview, notice);

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
          onClick={skip}
          className="text-[15px] font-medium text-muted-foreground underline underline-offset-4"
        >
          초대 코드가 없어요
        </button>
        <Button
          disabled={status.tone !== 'ok'}
          loading={register.isPending}
          onClick={() =>
            preview.data &&
            register.mutate({ code, policyVersion: preview.data.policyVersion })
          }
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

// 칸 아래 상태 하나로 모은다 — 안내 문구(못 찾음·등록 실패)가 확인 결과보다 앞선다
const statusOf = (
  preview: ReturnType<typeof useReferralPreviewQuery>,
  notice: string | null,
): Status => {
  if (preview.data)
    return {
      tone: 'ok',
      signupWon: inviteeWonOf(preview.data.signup),
      purchaseWon: inviteeWonOf(preview.data.purchase),
      notice,
    };
  if (notice) return { tone: 'error', message: notice };
  if (preview.error) {
    const failure = registrationFailureOf(preview.error);
    if (failure.kind === 'message')
      return { tone: 'error', message: failure.message };
  }
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
