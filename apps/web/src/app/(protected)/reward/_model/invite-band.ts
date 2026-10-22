// 환급 화면 초대 띠 문구 — 친구 한 명당 받는 금액, 오른쪽 끝 글(최대 금액 또는 N/10명), 진행 막대 비율
import {
  REFERRAL_INVITE_LIMIT,
  type InviteOffer,
} from '@/features/referral/model/inviter-reward';
import { formatWonShort } from '@/shared/lib/won';

export const inviteBandOf = ({
  offer,
  invitedCount,
}: {
  offer: InviteOffer;
  invitedCount: number;
}) => {
  const count = Math.min(invitedCount, REFERRAL_INVITE_LIMIT);
  return {
    inviterWon: offer.inviterWon,
    // 처음엔 0/10명보다 「얼마까지 받을 수 있나」가 누를 이유가 된다. 띠 끝이라 자리가 좁아 줄여 적는다
    sideLabel:
      count === 0
        ? `최대 ${formatWonShort(offer.maxWon)}`
        : `${count}/${REFERRAL_INVITE_LIMIT}명`,
    ratio: count / REFERRAL_INVITE_LIMIT,
  };
};
