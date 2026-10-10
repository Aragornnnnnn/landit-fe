'use client';

// 프리미엄 온보딩 — 결제 직후 환영 → (환급 상품이면 환급 안내) → 알람 등록 → 원래 가던 곳. 알람을 모르는 셸(브라우저·구 셸)이면 환영만 보고 바로 간다.
// 이동은 전부 replace — 끝난 뒤 뒤로 가기로 환영·페이월에 돌아오지 않게
import { useEffect, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { parseAlarmTime } from '@/features/alarm/model/alarm-time';
import { isAlarmShell } from '@/features/alarm/model/shell-alarm';
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAlarmStatus } from '@/features/alarm/model/useAlarmStatus';
import { AlarmSetupFlow } from '@/features/alarm/ui/AlarmSetupFlow';
import { preloadIntroPreview } from '@/features/alarm/ui/LockScreenPreview';
import {
  fetchLatestReward,
  refreshRewardAfterPurchase,
} from '@/features/reward/model/refresh-reward';
import { MAX_REFUND_WON } from '@/features/reward/model/refund-offer';
import { preloadRefundGuide } from '@/features/reward/ui/RefundGuide';
import { subscriptionKeys } from '@/features/subscription/model/my-subscription/keys';
import { REFUND_CHALLENGE_ENABLED } from '@/features/subscription/model/paywall-gate/payment-flag';
import { useAuthStore } from '@/shared/auth/auth-store';
import { homePath } from '@/shared/lib/last-tab';
import type { PremiumOnboardingPreview } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';

import {
  refundGuideCopyOf,
  type RefundGuideCopy,
} from '../_model/refund-guide-copy';
import { PremiumWelcome } from './PremiumWelcome';
import { RefundGuideStep } from './RefundGuideStep';

// 개발자 묶음의 「환급 문구로 보기」가 보여 주는 견본 — 6개월 상품을 막 산 사람
const PREVIEW_REFUND_COPY: RefundGuideCopy = {
  eyebrow: '오늘부터 챌린지 시작!',
  amount: `최대 ${formatWon(MAX_REFUND_WON)}`,
  caption: '183일 동안 매일 공부하면 구독료를 돌려받아요',
};

// 안내에 적을 글자를 찾는다. 쌓는 중이 아니라는 답이면 한 번 더 받아 본다 —
// 결제 직후라 서버 반영이 늦었을 수 있고, 지난 회차가 남은 사람이 다시 샀을 때도 처음 답은 "끝남"이다
const findRefundCopy = async (queryClient: QueryClient) => {
  const first = await fetchLatestReward(queryClient);
  const reward =
    first?.state === 'ACTIVE'
      ? first
      : await fetchLatestReward(queryClient, { fresh: true });
  return refundGuideCopyOf(reward);
};

// 환급을 기다려 주는 상한 — 응답이 오지 않는 연결에서 결제 직후의 화면이 멈춰 있으면 안 된다. 넘기면 안내 없이 간다
const REFUND_COPY_WAIT_MS = 5_000;
const settleWithin = <T,>(work: Promise<T>, ms: number) =>
  Promise.race([
    work,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

export const PremiumOnboardingScreen = ({
  returnTo,
  preview,
}: {
  returnTo?: string;
  /** 개발자 묶음의 미리보기 — ADMIN에게만 통한다 */
  preview?: PremiumOnboardingPreview;
}) => {
  const router = useRouter();
  const status = useAlarmStatus();
  const { data: setting, refetch } = useAlarmSettingQuery();
  const [step, setStep] = useState<'welcome' | 'guide' | 'alarm'>('welcome');
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');
  // 주소의 미리보기 값은 ADMIN일 때만 받는다 — 아니면 실제 상태대로 간다
  const forced = isAdmin ? preview : undefined;

  // 결제는 끝났는데 서버 반영이 늦어 구독 캐시가 아직 무료일 수 있다 — 다시 받아야 알람 예약(AlarmSync)이 유료로 본다
  useEffect(() => {
    void queryClient.invalidateQueries({
      queryKey: subscriptionKeys.mine(userId),
    });
  }, [queryClient, userId]);

  // 환급 상품을 샀으면 참여자가 된다 — 결제 전에 받아 둔 답으로 환급 안내를 건너뛰지 않게, 환영 연출이 도는 동안 환급과 안내의 그림을 미리 받는다
  useEffect(() => {
    if (!REFUND_CHALLENGE_ENABLED) return;
    refreshRewardAfterPurchase(queryClient);
    void fetchLatestReward(queryClient);
    preloadRefundGuide();
  }, [queryClient, userId]);

  const leave = () => router.replace(returnTo ?? homePath());

  // 셸이 알람을 못 쓴다고 답했으면(지원 안 하는 OS) 알람 단계를 건너뛴다. 아직 답이 없으면 쓸 수 있다고 본다
  const alarmCapable = isAlarmShell() && status?.supported !== false;

  // 알람 설정을 아직 모르면 받을 때까지 기다린다. 등록해 둔 재구독자나 끝내 못 읽은 경우는 등록 흐름을 보이지 않는다 — 다시 거치면 기존 시각을 덮어쓴다
  const next = async () => {
    if (forced === 'welcome') return leave();
    if (forced) return setStep('alarm');
    if (!alarmCapable) return leave();
    const known = setting ?? (await refetch({ cancelRefetch: false })).data;
    if (known?.enabled === false) setStep('alarm');
    else leave();
  };

  // 셸의 답보다 먼저 알람 단계에 들어왔는데 뒤늦게 못 쓴다는 답이 오면 흐름을 접는다 — 걸 수 없는 알람을 등록시키지 않는다
  const unsupportedInAlarm = step === 'alarm' && status?.supported === false;
  useEffect(() => {
    if (unsupportedInAlarm) router.replace(returnTo ?? homePath());
  }, [unsupportedInAlarm, router, returnTo]);

  // 환영 연출이 도는 동안 알람 소개의 폰 그림을 받아 둔다 — 튀어 오르는 폰이 빈 자리로 오르지 않게
  const mayShowAlarmSetup = alarmCapable && setting?.enabled !== true;
  useEffect(() => {
    if (mayShowAlarmSetup) preloadIntroPreview();
  }, [mayShowAlarmSetup]);

  // 방금 산 상품이 환급 상품이면 알람보다 먼저 환급 안내를 보여 준다 — 쉬면 0원이 된다는 걸 알고 알람을 맞추게.
  // 결제 직후라 환급을 아직 받는 중일 수 있어, 「다음」을 누른 순간의 값을 기다려서 본다
  const [refundCopy, setRefundCopy] = useState<RefundGuideCopy | null>(null);
  const showGuide = (copy: RefundGuideCopy) => {
    setRefundCopy(copy);
    setStep('guide');
  };
  // 기다리는 동안 「다음」을 잠근다 — 겹쳐 눌린 탭이 안내의 「다음」에 떨어지면 안내를 읽지 못하고 넘어간다.
  // 한 번 기다리기 시작하면 풀지 않는다. 그 뒤의 길은 전부 환영 화면을 떠난다
  const [awaitingReward, setAwaitingReward] = useState(false);
  const leaveWelcome = async () => {
    // 미리보기는 고른 케이스대로만 간다 — 「환급 문구로 보기」만 안내를 보여 준다
    if (forced === 'refund') return showGuide(PREVIEW_REFUND_COPY);
    // 환급이 열리기 전에는 묻지 않는다 — 조회 없이 바로 다음 단계로 간다
    if (forced || !REFUND_CHALLENGE_ENABLED) return void next();
    setAwaitingReward(true);
    const copy = await settleWithin(
      findRefundCopy(queryClient),
      REFUND_COPY_WAIT_MS,
    );
    if (copy) showGuide(copy);
    else void next();
  };

  if (step === 'welcome') {
    return (
      <PremiumWelcome
        onNext={() => void leaveWelcome()}
        pending={awaitingReward}
      />
    );
  }

  if (step === 'guide' && refundCopy) {
    return <RefundGuideStep copy={refundCopy} onNext={() => void next()} />;
  }

  return (
    <AlarmSetupFlow
      status={status}
      initialTime={parseAlarmTime(setting?.time ?? null)}
      onSkip={leave}
      onDone={leave}
      source="premium_onboarding"
      refund={refundCopy !== null}
    />
  );
};
