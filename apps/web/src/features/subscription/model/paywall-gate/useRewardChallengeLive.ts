'use client';

// 환급 챌린지가 열린 환경인가 — 환급 스위치가 켜져 있고 환급 상품이 실린 앱일 때.
// 페이월·내 정보·해지·결제 후 안내·계측이 이 한 기준을 같이 본다
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { REWARD_CHALLENGE_ENABLED } from './payment-flag';
import { isRewardChallengeLive } from './paywall-gate';

export const useRewardChallengeLive = (): boolean => {
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 닫힌 것으로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  return isRewardChallengeLive({
    rewardEnabled: REWARD_CHALLENGE_ENABLED,
    context,
  });
};
