// 환급 화면 초대 띠 문구 — 환급을 보러 온 사람을 붙잡는 한 줄. 초대로 더 받을 수 있는 금액을 말하고, 아래 게이지로 얼마나 찼는지 보인다
import type { InviteOffer } from '@/features/referral/model/inviter-reward';
import { formatWon } from '@/shared/lib/won';

// 서버 상한 진행 비율 — 아무도 없어도 빈 게이지를 두어 채울 자리가 있다는 걸 보인다
const ratioOf = ({ progress }: InviteOffer) =>
  progress ? Math.min(progress.used, progress.total) / progress.total : null;

// 금액만 강조색으로 그리게 앞·금액·뒤로 나눈다. 그릴 게 없으면 null
export const inviteBandOf = (offer: InviteOffer) => {
  const ratio = ratioOf(offer);
  // 상한을 채우면 내 몫은 끝나고 친구 몫만 남는다
  if (offer.full)
    return offer.inviteeWon > 0
      ? {
          lead: '친구에게 ',
          amount: formatWon(offer.inviteeWon),
          tail: ' 선물하기',
          ratio,
        }
      : null;
  // 최대 금액을 모르면(무제한·결제 보상이 섞임) 한 명당 금액으로 말한다
  if (offer.maxWon === null)
    return {
      lead: '친구 초대하고 ',
      amount: formatWon(offer.inviterWon),
      tail: '씩 추가 적립',
      ratio,
    };
  return {
    lead: '친구 초대하고 최대 ',
    amount: formatWon(offer.maxWon),
    tail: ' 추가 적립',
    ratio,
  };
};
