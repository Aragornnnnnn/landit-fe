// 돈통 그림을 고르는 규칙 — 쌓인 금액과 오늘 몫을 받았는지, 오늘이 아직이면 자정이 가까운지·며칠째 쉬었는지로 한 장을 정한다
import type { RewardView } from '@/features/reward/api/reward';
import {
  LONG_REST_DAYS,
  missedDaysOf,
} from '@/features/reward/model/reward-status';

export type PotStage =
  // 쌓인 게 없다
  | 'empty'
  // 쌓인 게 있는데 오늘의 시나리오는 아직 — 쉬어도 그대로라 잠자는 래디를 그린다
  | 'waiting'
  // 오늘이 아직인데 자정이 가깝다 — 손을 흔들며 재촉하는 래디
  | 'urgent'
  // 오늘이 아직이고 며칠째 쉬고 있다 — 시무룩한 래디
  | 'missed'
  // 쌓인 금액이 있고 오늘 몫도 받았다
  | 'kept'
  // 더 받을 몫 없이 다 모았다
  | 'complete';

export const potStageOf = (
  view: RewardView,
  // 자정이 가까운가 — 시계는 화면이 읽어 넘긴다
  { urgent = false }: { urgent?: boolean } = {},
): PotStage => {
  const current = view.current;
  // 도는 회차가 없다 — 기간을 마쳐 돌려받을 금액이 있으면 가득 찬 통, 검토 중이라 보관된 금액이 있으면 지킨 그림
  if (current === null) {
    if (view.state === 'ENDED' && view.pendingRefundWon > 0) return 'complete';
    return view.heldRefundWon > 0 ? 'kept' : 'empty';
  }
  if (current.balanceWon >= current.maximumWon) return 'complete';
  // 오늘은 쌓는 중일 때만 온다 — 검토 중이라 오지 않은 걸 "오늘 아직"으로 읽지 않는다
  const todayLeft = view.state === 'ACTIVE' && view.today?.earnedWon === 0;
  if (todayLeft && urgent) return 'urgent';
  if (todayLeft && missedDaysOf(view) >= LONG_REST_DAYS) return 'missed';
  if (current.balanceWon === 0) return 'empty';
  return todayLeft ? 'waiting' : 'kept';
};

// 화면 위쪽에 감도는 빛 — 그림에 맞춘다. 헤더 뒤부터 내려와야 헤더와 본문이 한 장으로 보인다
export type RewardGlow = 'gold' | 'calm';

const GLOW: Record<PotStage, RewardGlow | null> = {
  empty: null,
  // 오늘이 아직이면 차분한 살구빛
  waiting: 'calm',
  urgent: 'calm',
  missed: 'calm',
  kept: 'gold',
  complete: 'gold',
};

export const glowOf = (stage: PotStage) => GLOW[stage];
