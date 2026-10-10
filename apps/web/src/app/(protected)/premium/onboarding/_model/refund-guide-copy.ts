// 결제 직후 환급 안내를 보여 줄지와 거기 적을 글자 — 환급 상품으로 쌓기 시작한 사람에게만 보여 준다
import type { RewardView } from '@/features/reward/api/reward';
import { formatWon } from '@/shared/lib/won';

export interface RefundGuideCopy {
  // 큰 글자
  amount: string;
  // 그 아래 한 줄
  caption: string;
}

// 쌓는 중도 결제 확인 중도 아니면 null — 환급과 상관없는 상품을 샀거나, 지난 회차만 남아 있다
export const refundGuideCopyOf = (
  reward: RewardView | null,
): RefundGuideCopy | null => {
  // 결제는 끝났는데 환급 쪽 반영이 늦다 — 어느 상품인지 모르니 금액을 단정하지 않고 두 상품을 같이 말한다
  if (reward?.state === 'PENDING')
    return {
      amount: '환급 챌린지 시작',
      caption: '6개월은 낸 금액 전부, 3개월은 80%를 돌려받아요',
    };
  if (reward?.state !== 'ACTIVE' || reward.current === null) return null;

  return {
    amount: `최대 ${formatWon(reward.current.maximumWon)}`,
    caption:
      reward.remainingDays === null
        ? '매일 하면 돌려받아요'
        : `${reward.remainingDays}일 동안 매일 하면 돌려받아요`,
  };
};
