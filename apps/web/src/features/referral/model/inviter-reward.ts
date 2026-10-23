// 초대한 사람이 받는 몫 — 지금 조건에서 친구 한 명당 둘이 받을 금액과, 서버 정책이 정한 초대 상한
import type { ReferralStage, ReferralSummary } from '../api/referral';
import { inviteeWonOf } from './invitee-reward';

export const inviterWonOf = (stage: ReferralStage) =>
  stage.enabled && (stage.target === 'INVITER' || stage.target === 'BOTH')
    ? stage.inviterWon
    : 0;

// 상한을 사람 수로 — 인원 상한이면 그대로, 금액 상한이면 한 명당 금액으로 나눈 몫, 무제한이면 null
const limitCountOf = (
  limit: ReferralSummary['inviterLimit'],
  inviterWon: number,
) => {
  if (limit.value === null) return null;
  if (limit.type === 'INVITE_COUNT') return limit.value;
  if (limit.type === 'TOTAL_AMOUNT')
    return Math.floor(limit.value / inviterWon);
  return null;
};

// 지금 초대하면 둘이 받는 금액과 상한 — 친구가 가입하며 내 코드를 등록하는 순간 둘 다 적립된다.
// 초대한 사람 몫이 없으면 초대할 이유가 없어 null(초대 자리를 숨긴다)
export const inviteOfferOf = (
  summary: Pick<ReferralSummary, 'currentOffer' | 'inviterLimit'>,
) => {
  const inviterWon = inviterWonOf(summary.currentOffer.signup);
  if (inviterWon === 0) return null;
  const limitCount = limitCountOf(summary.inviterLimit, inviterWon);
  const { type, value } = summary.inviterLimit;
  return {
    inviterWon,
    inviteeWon: inviteeWonOf(summary.currentOffer.signup),
    // 무제한이면 null — 진행 막대와 최대 금액을 그리지 않는다
    limitCount,
    maxWon:
      type === 'TOTAL_AMOUNT'
        ? value
        : limitCount === null
          ? null
          : limitCount * inviterWon,
  };
};

export type InviteOffer = NonNullable<ReturnType<typeof inviteOfferOf>>;
