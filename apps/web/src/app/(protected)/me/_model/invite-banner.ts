// 내 정보 친구 초대 이벤트 띠의 설명 줄 — 내 돈을 보러 오는 화면이 아니라 「친구에게 선물」을 앞세운다(부탁하는 부담이 준다).
// 좁은 띠라 저절로 꺾이면 금액 중간에서 끊겨, 뜻이 끊기는 자리에서 직접 줄을 나눈다
import type { InviteOffer } from '@/features/referral/model/inviter-reward';
import { formatWon } from '@/shared/lib/won';

export const inviteBannerLinesOf = (offer: InviteOffer) => {
  if (offer.inviteeWon === 0)
    return [`친구 초대하고 ${formatWon(offer.inviterWon)}씩 적립`];
  // 상한을 채우면 내 몫은 끝난다
  if (offer.full) return [`친구에게 ${formatWon(offer.inviteeWon)} 선물하기`];
  return [
    `친구에게 ${formatWon(offer.inviteeWon)} 선물하고`,
    `나도 ${formatWon(offer.inviterWon)} 적립`,
  ];
};
