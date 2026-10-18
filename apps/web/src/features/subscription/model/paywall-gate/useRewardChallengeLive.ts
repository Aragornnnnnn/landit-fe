'use client';

// 환급 챌린지가 열린 환경인가 — 환급 스위치가 켜져 있고 환급 상품이 실린 앱일 때.
// 페이월·내 정보·해지·결제 후 안내·계측이 이 한 기준을 같이 본다
import { useNativeContext } from '@/shared/bridge/useNativeContext';

import { REWARD_CHALLENGE_ENABLED } from './payment-flag';
import { isRewardChallengeLive } from './paywall-gate';

export const useRewardChallengeLive = (): boolean => {
  const context = useNativeContext();
  return isRewardChallengeLive({
    rewardEnabled: REWARD_CHALLENGE_ENABLED,
    context,
  });
};
