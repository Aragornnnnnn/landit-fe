'use client';

// 내 환급을 화면들이 같은 조건으로 묻게 하는 자리 — 구독과 환급 두 도메인을 함께 봐야 해서 라우트 층에 둔다.
// 환급은 구독과 따로 묻는다 — 구독이 끝난 사람에게도 돌려받을 금액이 남아 있을 수 있다
import { useRewardQuery } from '@/features/reward/model/useRewardQuery';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { REFUND_CHALLENGE_ENABLED } from '@/features/subscription/model/paywall-gate/payment-flag';
import { usePaymentLive } from '@/features/subscription/model/paywall-gate/usePaymentLive';

import { rewardAudienceOf } from './reward-audience';

export const useMyReward = () => {
  const paymentLive = usePaymentLive();
  const { subscription, isError: subscriptionFailed } = useSubscriptionQuery({
    enabled: paymentLive,
  });
  const query = useRewardQuery({ enabled: REFUND_CHALLENGE_ENABLED });
  const audience = rewardAudienceOf({
    launched: REFUND_CHALLENGE_ENABLED,
    paymentLive,
    premium: subscription?.premium,
    subscriptionFailed,
    rewardLoaded: query.loaded,
    rewardFailed: query.fetched && !query.loaded,
    participant: query.reward !== null,
  });

  return { ...query, ...audience };
};
