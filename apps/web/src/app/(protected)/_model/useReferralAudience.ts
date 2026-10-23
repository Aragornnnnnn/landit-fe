'use client';

// 친구 초대 입구들이 같은 조건으로 묻게 하는 자리 — 환급 대상 판정(구독·환급)을 그대로 따라 라우트 층에 둔다
import { referralAudienceOf } from './referral-audience';
import { useMyReward } from './useMyReward';

export const useReferralAudience = () => {
  const { invited, settled, fetching, reward } = useMyReward();
  return referralAudienceOf({
    invited,
    settled,
    fetching,
    participant: reward !== null,
  });
};
