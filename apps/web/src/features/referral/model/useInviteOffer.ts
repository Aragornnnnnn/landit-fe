// 지금 초대 조건 — 요약 조회와, 초대한 사람 몫이 있을 때만 생기는 조건. 「초대가 켜졌는가」를 한 곳에서 판단한다
'use client';

import { inviteOfferOf } from './inviter-reward';
import { useReferralSummaryQuery } from './useReferralSummaryQuery';

export const useInviteOffer = () => {
  const summary = useReferralSummaryQuery();
  return {
    summary,
    offer: summary.data ? inviteOfferOf(summary.data.currentOffer) : null,
  };
};
