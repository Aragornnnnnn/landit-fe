// 조건 블록이 스켈레톤을 거쳐 왔는지 기억한다 — 뒤늦게 선 블록만 떠오르게 하고,
// 미리 받아 둔 요약으로 처음부터 서 있던 블록은 그냥 그린다(화면이 뜨자마자 세 장이 한꺼번에 흔들리면 어지럽다)
import type { SummaryBlocks } from './summary-blocks';

// direct = 기다림 없이 바로 섰다, waiting = 만드는 중이다, late = 기다렸다가 섰다(떠오르게 한다)
export type BlockArrival = 'direct' | 'waiting' | 'late';

export type Arrivals = Readonly<Record<keyof SummaryBlocks, BlockArrival>>;

export const FRESH_ARRIVALS: Arrivals = {
  growth: 'direct',
  reusedExpressions: 'direct',
  followUp: 'direct',
};

const nextArrival = (
  previous: BlockArrival,
  kind: SummaryBlocks[keyof SummaryBlocks]['kind'],
): BlockArrival => {
  if (kind === 'loading') return 'waiting';
  // 기다림을 거쳐 온 블록만 늦은 것이다. 한 번 늦었으면 계속 늦은 것으로 둬야
  // 폴링이 한 번 더 돌 때 애니메이션이 처음부터 다시 돌지 않는다
  if (kind === 'ready') return previous === 'direct' ? 'direct' : 'late';
  // 기다리다 접힌 블록은 그릴 것이 없다
  return 'direct';
};

export const trackArrivals = (
  previous: Arrivals,
  blocks: SummaryBlocks,
): Arrivals => {
  const names = Object.keys(previous) as (keyof SummaryBlocks)[];
  const next = Object.fromEntries(
    names.map((name) => [name, nextArrival(previous[name], blocks[name].kind)]),
  ) as Arrivals;

  // 바뀐 것이 없으면 같은 객체를 돌려준다 — 렌더마다 새 객체를 만들면 보는 쪽이 매번 다시 그린다
  return names.some((name) => next[name] !== previous[name]) ? next : previous;
};
