// 돈통 그림을 고르는 규칙 — 쌓인 금액과 오늘 몫을 받았는지로 한 장을 정한다
import type { RewardView } from '@/features/reward/api/reward';

export type PotStage =
  // 쌓인 게 없다
  | 'empty'
  // 쌓인 게 있는데 오늘의 시나리오는 아직 — 쉬어도 그대로라 잠자는 래디를 그린다
  | 'waiting'
  // 쌓인 금액이 있고 오늘 몫도 받았다
  | 'kept'
  // 더 받을 몫 없이 다 모았다
  | 'complete';

export const potStageOf = (view: RewardView): PotStage => {
  const current = view.current;
  // 도는 회차가 없다 — 기간을 마쳐 돌려받을 금액이 있으면 가득 찬 통, 검토 중이라 보관된 금액이 있으면 지킨 그림
  if (current === null) {
    if (view.state === 'ENDED' && view.pendingRefundWon > 0) return 'complete';
    return view.heldRefundWon > 0 ? 'kept' : 'empty';
  }
  if (current.balanceWon >= current.maximumWon) return 'complete';
  if (current.balanceWon === 0) return 'empty';
  // 오늘은 쌓는 중일 때만 온다 — 검토 중이라 오지 않은 걸 "오늘 아직"으로 읽지 않는다
  return view.state === 'ACTIVE' && view.today?.earnedWon === 0
    ? 'waiting'
    : 'kept';
};
