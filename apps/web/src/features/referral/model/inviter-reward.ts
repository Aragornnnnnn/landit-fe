// 초대한 사람이 받는 몫 — 지금 조건에서 친구 한 명당 둘이 받을 금액과, 지금까지 초대로 실제 들어온 돈
import { formatWon } from '@/shared/lib/won';

import type { ReferralReward, ReferralStage } from '../api/referral';
import { inviteeWonOf } from './invitee-reward';

export const inviterWonOf = (stage: ReferralStage) =>
  stage.enabled && (stage.target === 'INVITER' || stage.target === 'BOTH')
    ? stage.inviterWon
    : 0;

// 초대한 사람으로 받은 지급의 실제 적립 순액 합 — 대기·검토 중이거나 환불로 빠진 건 순액이 0이라 저절로 빠진다
export const earnedByInvitingOf = (rewards: ReferralReward[]) =>
  rewards
    .filter((reward) => reward.recipientRole === 'INVITER')
    .reduce((sum, reward) => sum + reward.creditedWon, 0);

// 한 사람이 초대로 받을 수 있는 친구 수 — BE 정책에 아직 상한이 없어 화면 표시만 여기서 맞춘다(BE에 상한 필드 요청)
export const REFERRAL_INVITE_LIMIT = 10;

// 지금 초대하면 둘이 받는 금액 — 친구가 가입하며 내 코드를 등록하는 순간 둘 다 적립된다.
// 초대한 사람 몫이 없으면 초대할 이유가 없어 null(초대 자리를 숨긴다)
export const inviteOfferOf = (offer: { signup: ReferralStage }) => {
  const inviterWon = inviterWonOf(offer.signup);
  if (inviterWon === 0) return null;
  return {
    inviterWon,
    inviteeWon: inviteeWonOf(offer.signup),
    maxWon: inviterWon * REFERRAL_INVITE_LIMIT,
  };
};

export type InviteOffer = NonNullable<ReturnType<typeof inviteOfferOf>>;

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
