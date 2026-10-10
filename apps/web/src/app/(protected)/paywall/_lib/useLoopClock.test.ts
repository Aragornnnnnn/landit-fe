// @vitest-environment jsdom
// 데모 장면 시계 — 멈춰 있으면 마지막 장면, 돌면 장면마다 정해진 시간만큼 머물고 끝나면 처음으로 돌아간다
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLoopClock } from './useLoopClock';

const DURATIONS = [100, 200, 300];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useLoopClock', () => {
  it('멈춰 있으면 마지막 장면이다 — 연출이 안 돌아도 완성된 화면이 보인다', () => {
    const { result } = renderHook(() => useLoopClock(DURATIONS, false));

    expect(result.current.step).toBe(2);
  });

  it('돌기 시작하면 첫 장면부터다', () => {
    const { result } = renderHook(() => useLoopClock(DURATIONS, true));

    expect(result.current).toEqual({ step: 0, loop: 0 });
  });

  it('장면마다 정해진 시간이 지나야 다음으로 넘어간다', () => {
    const { result } = renderHook(() => useLoopClock(DURATIONS, true));

    act(() => vi.advanceTimersByTime(99));
    expect(result.current.step).toBe(0);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.step).toBe(1);
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.step).toBe(2);
  });

  it('마지막 장면이 끝나면 처음으로 돌아가고 바퀴 수가 오른다', () => {
    const { result } = renderHook(() => useLoopClock(DURATIONS, true));

    // 장면이 넘어갈 때마다 다음 타이머가 걸리니 한 장면씩 흘려보낸다
    DURATIONS.forEach((duration) =>
      act(() => vi.advanceTimersByTime(duration)),
    );

    expect(result.current).toEqual({ step: 0, loop: 1 });
  });
});
