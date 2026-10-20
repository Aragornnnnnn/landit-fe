// 환급 소개 화면에 적을 글자 — 처음 보는 사람에게는 프리미엄이 사실상 0원이 되는 환급을, 무료로 며칠 해 온 사람에게는 받을 수 있었던 금액을 말한다
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
  // 큰 제목 — 0원만 주황으로 띄운다
  title: EmphasizedLine;
  // 제목 아래 한 줄
  subtitle: string;
  // 동전 탑 위로 뜨는 입금 알림의 금액
  deposit: string;
  // 연출 아래 한 줄. 오늘 대화를 이미 했을 때만
  caption: EmphasizedLine | null;
  // 아래 고정 버튼
  cta: string;
}

/**
 * 환급은 따로 파는 챌린지가 아니라 프리미엄 혜택이다 — 꾸준히 하면 결제한 금액이 그대로 돌아와 프리미엄이 사실상 0원이라고 말한다
 *
 * @param offer 지금 파는 이용권의 기간·하루 몫·최대 환급액
 * @param talkedToday 오늘의 시나리오를 이미 끝냈는가 — 결제 당일에 결제 전에 끝낸 대화도 적립으로 인정된다
 */
export const rewardIntroCopyOf = (
  offer: RewardOffer,
  talkedToday: boolean,
): RewardIntroCopy => ({
  title: { lead: '프리미엄이 사실상 ', strong: '0원!', tail: '' },
  subtitle: '환급 혜택으로 결제한 금액을 다 돌려받으세요',
  // 다 채우면 결제 금액과 같은 돈이 들어온다 — 그 순간을 토스 입금 알림 모양으로 보여 준다
  deposit: `${formatWon(offer.maximumWon)} 입금`,
  // 오늘 끝낸 대화는 결제 당일 결제 전이어도 인정된다 — 지금 시작하면 오늘 몫이 바로 들어온다
  caption: talkedToday
    ? {
        lead: '지금 시작하면 오늘 몫 ',
        strong: formatWon(offer.dailyWon),
        tail: '이 바로 쌓여요',
      }
    : null,
  cta: '프리미엄 시작하고 환급받기',
});

export interface MissedCopy {
  eyebrow: string;
  // 큰 글자 — 받지 못한 돈이라 흐리게 그린다
  amount: string;
  // 아래 상자 — 지금 시작하면 받는 돈
  box: EmphasizedLine;
  // 상자 아래 한 줄 — 놓친 돈만 말하면 겁만 주니 결제한 금액도 돌아온다고 덧붙인다
  note: string;
}

export const missedCopyOf = ({
  pastDays,
  missedWon,
  dailyWon,
  talkedToday,
}: MissedReward): MissedCopy => {
  const daily = formatWon(dailyWon);
  return {
    eyebrow: `지난 ${pastDays}일 동안 받을 수 있었던 금액`,
    amount: formatWon(missedWon),
    // 「시작하면」 뒤에서 줄을 바꾼다 — 폭에 맡기면 「쌓여요」만 홀로 다음 줄로 떨어진다.
    // 지난 날은 돌아오지 않지만 오늘 몫은 결제 당일 결제 전 대화도 인정돼 아직 받을 수 있다
    box: talkedToday
      ? {
          lead: '지금 프리미엄을 시작하면\n오늘 몫 ',
          strong: daily,
          tail: '이 바로 쌓여요',
        }
      : {
          lead: '프리미엄을 시작하면\n오늘부터 ',
          strong: daily,
          tail: '씩 쌓여요',
        },
    note: '꾸준히 하면 결제한 금액을 다 돌려받아요',
  };
};
