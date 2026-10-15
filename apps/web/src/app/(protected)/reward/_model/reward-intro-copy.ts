// 환급 소개 화면에 적을 글자 — 처음 보는 사람에게는 다 채웠을 때의 최대 금액을, 무료로 며칠 해 온 사람에게는 놓친 금액을 말한다
import type { MissedReward } from '@/features/reward/model/missed-reward';
import type { RewardOffer } from '@/features/reward/model/refund-offer';
import { formatWon } from '@/shared/lib/won';

// 가운데 낱말만 주황으로 띄우는 한 줄
export interface EmphasizedLine {
  lead: string;
  strong: string;
  tail: string;
}

export interface RewardIntroCopy {
  // 큰 글자 위 한 줄
  eyebrow: string;
  // 큰 글자
  amount: string;
  // 그 아래 한 줄. 없으면 그 자리에 규칙을 적는다
  caption: EmphasizedLine | null;
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
): RewardIntroCopy => ({
  // 버튼은 어느 쪽이든 같다 — 버튼까지 500원을 말하면 챌린지가 작아 보인다
  cta: `${offer.days}일 환급 챌린지 시작하기`,
  // 첫날은 오늘 몫보다 큰 약속을 먼저 보여 준다 — 500원은 작아서 시시해 보인다
  eyebrow: `${offer.days}일 동안 매일 대화하면`,
  amount: `최대 ${formatWon(offer.maximumWon)}`,
  // 오늘 끝낸 대화는 결제 당일 결제 전이어도 인정된다 — 지금 시작하면 오늘 몫이 바로 들어온다
  caption: talkedToday
    ? {
        lead: '지금 시작하면 바로 ',
        strong: formatWon(offer.dailyWon),
        tail: '이 쌓여요',
      }
    : null,
});

export interface MissedCopy {
  eyebrow: string;
  // 큰 글자 — 받지 못한 돈이라 흐리게 그린다
  amount: string;
  // 아래 상자 — 지금 시작하면 받는 돈
  box: EmphasizedLine;
}

export const missedCopyOf = ({
  pastDays,
  missedWon,
  dailyWon,
  talkedToday,
}: MissedReward): MissedCopy => {
  const daily = formatWon(dailyWon);
  return {
    eyebrow: `${pastDays}일 동안 놓친 환급액`,
    amount: formatWon(missedWon),
    // 지난 날은 돌아오지 않지만 오늘 몫은 결제 당일 결제 전 대화도 인정돼 아직 받을 수 있다
    box: talkedToday
      ? { lead: '지금 시작하면 첫 ', strong: daily, tail: '이 쌓여요' }
      : { lead: '챌린지를 시작하고 첫 ', strong: daily, tail: '을 받아봐요' },
  };
};
