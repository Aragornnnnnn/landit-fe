// 조건 블록(실수 기억·배운 표현 재사용·다음 스몰톡에서)의 상태를 한 곳에서 판정한다.
// 화면은 결과만 받아 그린다 — "만드는 중이면 스켈레톤, 상한을 넘겼거나 내용이 없으면 숨김"을 블록마다 다시 쓰지 않는다
import type {
  SmallTalkSummaryFollowUp,
  SmallTalkSummaryGrowth,
  SmallTalkSummaryResponse,
  SmallTalkSummaryReusedExpression,
} from '@/features/small-talk/api/small-talk';

export type BlockState<T> =
  | { kind: 'ready'; data: T }
  // 종료 후 잡이 아직 안 끝났다 — 자리를 잡아 두고 기다린다
  | { kind: 'loading' }
  | { kind: 'hidden' };

export interface SummaryBlocks {
  growth: BlockState<SmallTalkSummaryGrowth>;
  reusedExpressions: BlockState<SmallTalkSummaryReusedExpression[]>;
  followUp: BlockState<SmallTalkSummaryFollowUp>;
}

// 잡 결과를 기다리는 블록 — 아직이면 스켈레톤, 상한까지 기다렸으면 포기하고 숨긴다
const awaiting = <T>(
  pending: boolean,
  waitExpired: boolean,
  ready: () => BlockState<T>,
): BlockState<T> => {
  if (!pending) return ready();
  return waitExpired ? { kind: 'hidden' } : { kind: 'loading' };
};

export const toSummaryBlocks = (
  summary: SmallTalkSummaryResponse,
  waitExpired: boolean,
): SummaryBlocks => ({
  // 실수 기억은 잡 없이 응답에 바로 실린다 — 없으면 null
  growth: summary.growth
    ? { kind: 'ready', data: summary.growth }
    : { kind: 'hidden' },
  reusedExpressions: awaiting<SmallTalkSummaryReusedExpression[]>(
    summary.reusedExpressions.pending,
    waitExpired,
    () =>
      summary.reusedExpressions.items.length > 0
        ? { kind: 'ready', data: summary.reusedExpressions.items }
        : { kind: 'hidden' },
  ),
  // 작업이 끝났는데도 물어볼 기억이 없었으면 질문이 null로 온다 — 그때는 블록을 그리지 않는다
  followUp: awaiting<SmallTalkSummaryFollowUp>(
    summary.followUp.pending,
    waitExpired,
    () =>
      summary.followUp.question
        ? { kind: 'ready', data: summary.followUp }
        : { kind: 'hidden' },
  ),
});
