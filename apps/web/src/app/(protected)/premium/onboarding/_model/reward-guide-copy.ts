// 결제 직후 환급 안내를 보여 줄지와 거기 적을 글자 — 환급 챌린지로 쌓기 시작한 사람에게만 보여 준다
import type { RewardView } from '@/features/reward/api/reward';
import { dailyWonOf } from '@/features/reward/model/reward-status';
import { carriedRewardWonOf } from '@/features/reward/model/stored-reward';
import { formatWon } from '@/shared/lib/won';

export interface RewardGuideCopy {
  // 큰 글자 위 한 줄
  eyebrow: string;
  // 큰 글자
  amount: string;
  // 그 아래 한 줄
  caption: string;
  // 결제 전에 받아 둔 돈(초대 보상 등)이 회차에 합쳐져 0원이 아닌 데서 시작하면 그 한 줄. 아니면 null
  startNote: string | null;
  // 하루 몫 — 규칙과 보기 내역이 이 금액으로 말한다. 결제 확인이 늦어 아직 모르면 null
  dailyWon: number | null;
  // 금액을 알고 적은 안내인가 — 결제 확인이 늦으면 거짓
  confirmed: boolean;
}

// 쌓는 중도 결제 확인 중도 아니면 null — 환급과 상관없는 상품을 샀거나, 지난 회차만 남아 있다
export const rewardGuideCopyOf = (
  reward: RewardView | null,
): RewardGuideCopy | null => {
  // 결제는 끝났는데 환급 쪽 반영이 늦다 — 얼마짜리를 샀는지 모르니 금액을 단정하지 않는다
  if (reward?.state === 'PENDING')
    return {
      eyebrow: '오늘부터 챌린지 시작!',
      amount: '환급 챌린지',
      caption: '오늘의 시나리오를 한 날마다 쌓이고, 모은 만큼 돌려받아요',
      startNote: null,
      dailyWon: null,
      confirmed: false,
    };
  if (reward?.state !== 'ACTIVE' || reward.current === null) return null;

  return {
    eyebrow: '오늘부터 챌린지 시작!',
    amount: `최대 ${formatWon(reward.current.maximumWon)}`,
    // 남은 날이 아니라 상품의 전체 기간이다 — 며칠 뒤에 봐도 같은 말을 한다
    caption: `${reward.current.eligibleDays}일 동안 모은 만큼 돌려받아요`,
    startNote: startNoteOf(carriedRewardWonOf(reward.current, reward.today)),
    dailyWon: dailyWonOf(reward),
    confirmed: true,
  };
};

// 결제 전 몫이 있으면 0원이 아닌 데서 시작한다는 한 줄
const startNoteOf = (carriedWon: number) =>
  carriedWon > 0 ? `${formatWon(carriedWon)}부터 시작해요` : null;
