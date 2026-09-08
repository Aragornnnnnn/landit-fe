'use client';

// 학습 진입 게이트 — 진입 지점(대화 시작·표현 학습·스몰톡·대화 직후 화면)이 guard로 감싸 부르면,
// 무료 구간을 다 쓴 무료 사용자는 페이월로 보내고 나머지는 그대로 들여보낸다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
import { EVENTS, type PaywallGateEntry } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { paywallPath } from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { PAYMENT_ENABLED } from './payment-flag';
import { decidePaywallGate, type PaywallGateDecision } from './paywall-gate';
import { useSubscriptionQuery } from './useSubscriptionQuery';

interface GuardOptions {
  // 계측용 — 어느 문에서 막혔는지
  entry: PaywallGateEntry;
  // 결제 뒤 돌아올 곳. 없으면 페이월이 홈으로 보낸다
  returnTo?: string;
  // 호출부가 대화가 방금 끝났음을 이미 아는 경우 — 서버 값이 아직 안 따라왔어도 무료 구간을 다 쓴 것으로 본다
  conversationJustFinished?: boolean;
}

export const usePaywallGate = () => {
  const router = useRouter();
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 브라우저로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  const { subscription, isError } = useSubscriptionQuery();

  const decide = (
    conversationCompletedSinceLaunch: boolean | null,
  ): PaywallGateDecision =>
    // 구독 조회 실패(구독 API 미배포 포함)는 잠그지 않는다 — 잘못 막는 쪽이 더 나쁘다
    isError
      ? 'open'
      : decidePaywallGate({
          paymentEnabled: PAYMENT_ENABLED,
          appVersion: context?.appVersion ?? null,
          // 아직 못 받았거나 BE가 필드를 아직 안 주면 null — decidePaywallGate가 unknown으로 둔다
          premium: subscription?.premium ?? null,
          conversationCompletedSinceLaunch,
        });

  const decision = decide(
    subscription?.conversationCompletedSinceLaunch ?? null,
  );

  // locked면 페이월로, 아니면 원래 하려던 이동을 그대로. unknown(재료가 늦음)도 막지 않는다 — 다음 진입에서 잡힌다
  const guard = (
    go: () => void,
    { entry, returnTo, conversationJustFinished }: GuardOptions,
  ) => {
    const verdict = conversationJustFinished ? decide(true) : decision;
    if (verdict !== 'locked') {
      go();
      return;
    }
    track(EVENTS.PAYWALL_GATE_LOCKED, { entry });
    router.push(paywallPath({ from: returnTo }));
  };

  return { decision, guard };
};
