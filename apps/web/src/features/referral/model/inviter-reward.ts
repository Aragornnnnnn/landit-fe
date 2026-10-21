// 초대한 사람이 받는 몫 — 지금 조건에서 친구 한 명당 받을 금액과, 지금까지 초대로 실제 들어온 돈
import { formatWon } from '@/shared/lib/won';

import type { ReferralReward, ReferralStage } from '../api/referral';

export const inviterWonOf = (stage: ReferralStage) =>
  stage.enabled && (stage.target === 'INVITER' || stage.target === 'BOTH')
    ? stage.inviterWon
    : 0;

// 초대한 사람으로 받은 지급의 실제 적립 순액 합 — 대기·검토 중이거나 환불로 빠진 건 순액이 0이라 저절로 빠진다
export const earnedByInvitingOf = (rewards: ReferralReward[]) =>
  rewards
    .filter((reward) => reward.recipientRole === 'INVITER')
    .reduce((sum, reward) => sum + reward.creditedWon, 0);

// 초대 자리의 한 줄 — 친구 한 명이 가입할 때 받는 금액, 없으면 결제할 때 받는 금액. 둘 다 없으면 초대할 이유가 없어 null
export const inviteHeadlineOf = (offer: {
  signup: ReferralStage;
  purchase: ReferralStage;
}) => {
  const signupWon = inviterWonOf(offer.signup);
  if (signupWon > 0) return `친구 초대하면 ${formatWon(signupWon)}`;
  const purchaseWon = inviterWonOf(offer.purchase);
  if (purchaseWon > 0) return `친구가 결제하면 ${formatWon(purchaseWon)}`;
  return null;
};
