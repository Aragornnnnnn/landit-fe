'use client';

// 친구 초대 입구들이 같은 조건으로 묻게 하는 자리 — 환급 대상 판정(구독·환급)을 그대로 따라 라우트 층에 둔다
// 가로 import 사유: 초대를 열지는 판매 규칙이 정한다
import { useOffers } from '@/features/subscription/model/offers/useOffers';

import { referralAudienceOf } from './referral-audience';
import { useMyReward } from './useMyReward';

export const useReferralAudience = () => {
  const { invited, settled, fetching, reward } = useMyReward();
  const { referral: live } = useOffers();
  return referralAudienceOf({
    live,
    invited,
    settled,
    fetching,
    participant: reward !== null,
  });
};
