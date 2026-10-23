// 환급을 아직 시작하지 않은 사람에게 보관 중인 적립금 — 초대 코드로 가입해 받은 돈처럼 결제 전에 들어온 몫이다.
// 결제하면 그 회차에 합쳐져 기간이 끝날 때 함께 돌려받는다
import type { RewardCycle, RewardToday, RewardView } from '../api/reward';

// 환급을 산 적이 없는 사람(NONE)만 센다 — 기간이 끝났거나 확인 중인 사람의 잔액에는 지난 회차 학습분이 섞일 수 있다
export const storedRewardWonOf = (view: RewardView) =>
  view.state === 'NONE' ? Math.max(view.balanceWon ?? 0, 0) : 0;

// 막 시작한 회차에 결제 전 몫(초대 보상 등)이 얼마나 합쳐졌나 — 회차 잔액에서 날마다 학습으로 받은 몫을 뺀다.
// 결제 당일 이미 끝낸 오늘의 시나리오가 회차에 들어가도 그건 시작 금액으로 치지 않는다
export const carriedRewardWonOf = (
  cycle: RewardCycle,
  today: RewardToday | null,
) => {
  const learnedWon =
    cycle.days.length > 0
      ? cycle.days.reduce((sum, day) => sum + day.earnedWon, 0)
      : (today?.earnedWon ?? 0);
  return Math.max(cycle.balanceWon - learnedWon, 0);
};
