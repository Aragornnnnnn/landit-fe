// 환급 화면 초대 띠 문구 — 친구 한 명당 받는 금액, 오른쪽 끝 글(최대 금액 또는 N/상한명), 진행 막대 비율
import type { InviteOffer } from '@/features/referral/model/inviter-reward';
import { formatWonShort } from '@/shared/lib/won';

const sideLabelOf = (offer: InviteOffer, invitedCount: number) => {
  // 처음엔 0/10명보다 「얼마까지 받을 수 있나」가 누를 이유가 된다. 띠 끝이라 자리가 좁아 줄여 적는다
  if (invitedCount === 0)
    return offer.maxWon === null
      ? null
      : `최대 ${formatWonShort(offer.maxWon)}`;
  if (offer.limitCount === null) return `${invitedCount}명`;
  return `${Math.min(invitedCount, offer.limitCount)}/${offer.limitCount}명`;
};

export const inviteBandOf = ({
  offer,
  invitedCount,
}: {
  offer: InviteOffer;
  invitedCount: number;
}) => ({
  inviterWon: offer.inviterWon,
  sideLabel: sideLabelOf(offer, invitedCount),
  // 상한이 없으면 막대를 그리지 않는다
  ratio:
    offer.limitCount === null
      ? null
      : Math.min(invitedCount, offer.limitCount) / offer.limitCount,
});
