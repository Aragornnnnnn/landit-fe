// 돈통 그림을 고르는 규칙 — 쌓인 금액과 오늘 한 일로 한 장을 정한다
import type { RewardView } from '@/features/reward/api/reward';
import { atRiskOf } from '@/features/reward/model/reward-status';

export type PotStage =
  // 쌓인 게 없다
  | 'empty'
  // 어제 쉬어서 사라졌다
  | 'lost'
  // 쌓인 게 있는데 오늘은 아직
  | 'waiting'
  // 오늘 하나라도 해서 지켰다
  | 'kept'
  // 더 받을 몫 없이 다 모았다
  | 'complete';

export const potStageOf = (view: RewardView): PotStage => {
  const current = view.current;
  // 도는 회차가 없다 — 기간을 마쳐 돌려받을 금액이 있으면 가득 찬 통, 그 밖에는 빈 통
  if (current === null)
    return view.state === 'ENDED' && view.pendingRefundWon > 0
      ? 'complete'
      : 'empty';
  if (current.balanceWon >= current.maximumWon) return 'complete';
  if (atRiskOf(view)) return 'waiting';
  // 오늘 했거나, 검토 중이라 오늘이 없다 — 쌓인 금액은 그대로 있다
  if (current.balanceWon > 0) return 'kept';
  return view.lostYesterdayWon > 0 ? 'lost' : 'empty';
};

export type PotArt = PotStage | 'sleeping';

// 오늘이 아직이어도 낮에는 잠자는 래디를 쓴다 — 다급한 그림은 자정이 가까울 때만
export const potArtOf = (stage: PotStage, urgent: boolean): PotArt =>
  stage === 'waiting' && !urgent ? 'sleeping' : stage;
