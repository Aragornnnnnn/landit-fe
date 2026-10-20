'use client';

// 내 환급을 화면들이 같은 조건으로 묻게 하는 자리 — 구독과 환급 두 도메인을 함께 봐야 해서 라우트 층에 둔다.
// 환급은 구독과 따로 묻는다 — 구독이 끝난 사람에게도 돌려받을 금액이 남아 있을 수 있다
import { useRewardQuery } from '@/features/reward/model/useRewardQuery';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { usePaymentLive } from '@/features/subscription/model/paywall-gate/usePaymentLive';
import { useRewardChallengeLive } from '@/features/subscription/model/paywall-gate/useRewardChallengeLive';
import { isTourPreview } from '@/features/tour/model/tour-preview';

import { asTourPreview, rewardAudienceOf } from './reward-audience';

export const useMyReward = () => {
  const paymentLive = usePaymentLive();
  const { subscription, isError: subscriptionFailed } = useSubscriptionQuery({
    enabled: paymentLive,
  });
  const launched = useRewardChallengeLive();
  const query = useRewardQuery({ enabled: launched });
  const audience = rewardAudienceOf({
    launched,
    paymentLive,
    premium: subscription?.premium,
    subscriptionFailed,
    rewardLoaded: query.loaded,
    rewardFailed: query.fetched && !query.loaded,
    participant: query.reward !== null,
  });

  // 개발자 묶음의 투어 미리보기가 켜졌으면 이번 실행 동안 환급을 권할 무료 유저로 친다
  if (isTourPreview()) return asTourPreview({ ...query, ...audience });
  return { ...query, ...audience };
};
