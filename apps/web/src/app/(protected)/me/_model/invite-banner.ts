// 내 정보 친구 초대 이벤트 띠의 둘째 줄 — 내 돈을 보러 오는 화면이 아니라 「친구에게 선물」을 앞세운다(부탁하는 부담이 준다)
import type { InviteOffer } from '@/features/referral/model/inviter-reward';
import { formatWon } from '@/shared/lib/won';

export const inviteBannerLineOf = (offer: InviteOffer) =>
  offer.inviteeWon > 0
    ? `친구에게 ${formatWon(offer.inviteeWon)} 선물하고 나도 ${formatWon(offer.inviterWon)} 적립`
    : `친구 초대하고 ${formatWon(offer.inviterWon)}씩 적립`;
