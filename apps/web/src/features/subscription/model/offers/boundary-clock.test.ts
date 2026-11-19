// 경계 시각을 넘을 때만 바뀌는 시계 — 넘는 순간 화면에 알리는지, 그 사이에는 값이 흔들리지 않는지 확인한다
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBoundaryClock } from './boundary-clock';

const MIDNIGHT = Date.parse('2026-11-20T00:00:00+09:00');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MIDNIGHT - 60_000);
});
afterEach(() => vi.useRealTimers());

describe('createBoundaryClock', () => {
  it('경계를 넘지 않는 동안에는 같은 값을 돌려준다 — 렌더마다 값이 바뀌면 화면이 끝없이 다시 그려진다', () => {
    const clock = createBoundaryClock([MIDNIGHT]);
    const first = clock.getSnapshot();

    vi.advanceTimersByTime(30_000);

    expect(clock.getSnapshot()).toBe(first);
  });

  it('경계 시각이 되면 구독한 화면에 알리고 경계를 지난 시각을 돌려준다', () => {
    const clock = createBoundaryClock([MIDNIGHT]);
    const onChange = vi.fn();
    clock.subscribe(onChange);

    vi.advanceTimersByTime(60_000);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(clock.getSnapshot()).toBeGreaterThanOrEqual(MIDNIGHT);
  });

  it('구독한 화면이 없어도 경계를 넘은 뒤에 읽으면 지난 시각을 돌려준다', () => {
    const clock = createBoundaryClock([MIDNIGHT]);
    clock.getSnapshot();

    vi.setSystemTime(MIDNIGHT + 1);

    expect(clock.getSnapshot()).toBeGreaterThanOrEqual(MIDNIGHT);
  });

  it('타이머 상한(약 24일)보다 먼 경계도 그 시각에 알린다', () => {
    const far = MIDNIGHT + 40 * 24 * 60 * 60 * 1000;
    const clock = createBoundaryClock([far]);
    const onChange = vi.fn();
    clock.subscribe(onChange);

    vi.advanceTimersByTime(far - Date.now() - 1);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('구독을 끊으면 경계가 지나도 알리지 않는다', () => {
    const clock = createBoundaryClock([MIDNIGHT]);
    const onChange = vi.fn();
    const unsubscribe = clock.subscribe(onChange);

    unsubscribe();
    vi.advanceTimersByTime(120_000);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('고정한 시각이 있으면 실제 시각 대신 그 시각을 돌려주고, 바뀌면 알린다', () => {
    let pinned: number | null = null;
    const clock = createBoundaryClock([MIDNIGHT], () => pinned);
    const onChange = vi.fn();
    clock.subscribe(onChange);

    pinned = MIDNIGHT + 1;
    clock.refresh();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(clock.getSnapshot()).toBe(MIDNIGHT + 1);
  });
});
