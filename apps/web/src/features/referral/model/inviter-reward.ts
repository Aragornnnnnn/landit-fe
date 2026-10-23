// 초대한 사람이 받는 몫 — 지금 조건에서 친구 한 명당 둘이 받을 금액과, 서버 정책이 정한 초대 상한의 진행
import type { ReferralStage, ReferralSummary } from '../api/referral';
import { inviteeWonOf } from './invitee-reward';

export const inviterWonOf = (stage: ReferralStage) =>
  stage.enabled && (stage.target === 'INVITER' || stage.target === 'BOTH')
    ? stage.inviterWon
    : 0;

// 상한의 진행 — 인원 상한은 등록한 친구 수, 금액 상한은 서버가 정한 초대인 지급액으로 센다. 무제한·없음이면 null
export type InviteProgress = {
  kind: 'count' | 'amount';
  used: number;
  total: number;
} | null;

const progressOf = (
  summary: Pick<ReferralSummary, 'inviterLimit' | 'invitedCount'>,
): InviteProgress => {
  const limit = summary.inviterLimit;
  // 상한 값이 0이면 그릴 진행이 없다 — 0으로 나누지 않게 무제한처럼 둔다
  if (!limit || limit.type === 'UNLIMITED' || !limit.value) return null;
  return {
    kind: limit.type === 'INVITE_COUNT' ? 'count' : 'amount',
    used:
      limit.used ?? (limit.type === 'INVITE_COUNT' ? summary.invitedCount : 0),
    total: limit.value,
  };
};

// 지금 초대하면 둘이 받는 금액과 상한 — 친구가 가입하며 내 코드를 등록하는 순간 둘 다 적립된다.
// 초대한 사람 몫이 없으면 초대할 이유가 없어 null(초대 자리를 숨긴다)
export const inviteOfferOf = (
  summary: Pick<
    ReferralSummary,
    'currentOffer' | 'inviterLimit' | 'invitedCount'
  >,
) => {
  const inviterWon = inviterWonOf(summary.currentOffer.signup);
  if (inviterWon === 0) return null;
  const progress = progressOf(summary);
  // 결제 단계에도 초대한 사람 몫이 있으면 서버 적립금에 그것까지 더해져, 인원 × 가입 금액으로 낸 최대 금액을 넘는다
  const purchaseShared = inviterWonOf(summary.currentOffer.purchase) > 0;
  const maxWon =
    progress?.kind === 'amount'
      ? progress.total
      : progress?.kind === 'count' && !purchaseShared
        ? progress.total * inviterWon
        : null;
  return {
    inviterWon,
    inviteeWon: inviteeWonOf(summary.currentOffer.signup),
    progress,
    maxWon,
    // 다 찼는지는 서버가 준 남은 양으로 — 금액 상한의 부분 지급까지 서버와 같게 판단한다
    full: progress !== null && (summary.inviterLimit?.remaining ?? 1) === 0,
  };
};

export type InviteOffer = NonNullable<ReturnType<typeof inviteOfferOf>>;
