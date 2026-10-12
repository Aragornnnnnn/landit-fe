// 환급 소개 화면에 적을 글자 — 오늘의 시나리오를 아직 안 했으면 다 채웠을 때 돌려받는 최대 금액을, 이미 했으면 그 대화로 벌써 쌓인 것처럼 말한다
import type { RewardOffer } from '@/features/reward/model/refund-offer';
import { formatWon } from '@/shared/lib/won';

export interface RewardIntroCopy {
  // 큰 글자 위 한 줄
  eyebrow: string;
  // 큰 글자
  amount: string;
  // 그 아래 한 줄
  caption: string;
  // 아래 고정 버튼
  cta: string;
}

/**
 * @param offer 지금 파는 챌린지의 값
 * @param talkedToday 오늘의 시나리오를 이미 끝냈는가 — 결제 당일에 결제 전에 끝낸 대화도 적립으로 인정된다
 */
export const rewardIntroCopyOf = (
  offer: RewardOffer,
  talkedToday: boolean,
): RewardIntroCopy => {
  const daily = formatWon(offer.dailyWon);
  // 버튼은 어느 쪽이든 같다 — 오늘 몫은 화면이 이미 말하고, 버튼까지 500원을 말하면 챌린지가 작아 보인다
  const cta = `${offer.days}일 환급 챌린지 시작하기`;
  return talkedToday
    ? {
        cta,
        eyebrow: '오늘 대화로 쌓인 환급액',
        amount: daily,
        // 내일로 넘어가면 이 대화는 인정되지 않는다 — 오늘이라고 못 박는다
        caption: '오늘 챌린지를 시작하면 받을 수 있어요',
      }
    : {
        cta,
        eyebrow: `${offer.days}일 동안 매일 대화하면`,
        amount: `최대 ${formatWon(offer.maximumWon)}`,
        caption: `오늘의 시나리오를 할 때마다 ${daily}씩 쌓여요`,
      };
};
