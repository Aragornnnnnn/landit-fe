// 스켈레톤을 거쳐 뒤늦게 선 블록만 등장 애니메이션을 단다 — 처음부터 있던 블록은 그냥 그린다
import { describe, expect, it } from 'vitest';

import { FRESH_ARRIVALS, trackArrivals } from './late-blocks';
import type { SummaryBlocks } from './summary-blocks';

type Kind = SummaryBlocks[keyof SummaryBlocks]['kind'];

const blocksOf = (
  overrides: Partial<Record<keyof SummaryBlocks, Kind>> = {},
): SummaryBlocks =>
  ({
    growth: { kind: overrides.growth ?? 'hidden' },
    reusedExpressions: { kind: overrides.reusedExpressions ?? 'hidden' },
    followUp: { kind: overrides.followUp ?? 'hidden' },
  }) as SummaryBlocks;

describe('trackArrivals', () => {
  it('미리 받아 둔 요약으로 바로 선 블록은 늦게 온 것이 아니다', () => {
    const arrivals = trackArrivals(
      FRESH_ARRIVALS,
      blocksOf({ reusedExpressions: 'ready', followUp: 'ready' }),
    );

    expect(arrivals.reusedExpressions).toBe('direct');
    expect(arrivals.followUp).toBe('direct');
  });

  it('스켈레톤을 거쳐 온 블록은 늦게 온 것으로 표시한다', () => {
    // Given 처음엔 만드는 중이었다가
    const waiting = trackArrivals(
      FRESH_ARRIVALS,
      blocksOf({ followUp: 'loading' }),
    );

    // When 폴링으로 도착하면
    const arrived = trackArrivals(waiting, blocksOf({ followUp: 'ready' }));

    expect(arrived.followUp).toBe('late');
  });

  it('한 번 늦게 온 블록은 다시 그려도 계속 늦게 온 것이다', () => {
    // 폴링이 한 번 더 돌 때마다 애니메이션이 처음부터 다시 돌면 안 된다
    const waiting = trackArrivals(
      FRESH_ARRIVALS,
      blocksOf({ followUp: 'loading' }),
    );
    const arrived = trackArrivals(waiting, blocksOf({ followUp: 'ready' }));

    expect(
      trackArrivals(arrived, blocksOf({ followUp: 'ready' })).followUp,
    ).toBe('late');
  });

  it('기다리다 접힌 블록은 늦게 온 것으로 치지 않는다', () => {
    // 상한을 넘겨 숨긴 블록은 그릴 것 자체가 없다
    const waiting = trackArrivals(
      FRESH_ARRIVALS,
      blocksOf({ reusedExpressions: 'loading' }),
    );

    const hidden = trackArrivals(
      waiting,
      blocksOf({ reusedExpressions: 'hidden' }),
    );

    expect(hidden.reusedExpressions).toBe('direct');
  });

  it('바뀐 것이 없으면 같은 객체를 돌려준다', () => {
    const blocks = blocksOf({ followUp: 'ready' });

    expect(trackArrivals(FRESH_ARRIVALS, blocks)).toBe(FRESH_ARRIVALS);
  });
});
