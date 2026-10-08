// 숫자 카운트업 — 시작 전엔 최종값을 보여 주고, 시작하면 0부터 올라가 최종값에서 멈춘다
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCountUp } from './useCountUp';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useCountUp', () => {
  it('시작 전에는 최종값이다 — 연출이 안 돌아도 숫자는 맞다', () => {
    const { result } = renderHook(() => useCountUp(121, false));

    expect(result.current).toBe(121);
  });

  it('시작하면 0에서 출발해 중간값을 거친다', () => {
    const { result } = renderHook(() => useCountUp(121, true, 800));

    expect(result.current).toBe(0);
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(121);
  });

  it('시간이 다 지나면 최종값에서 멈춘다', () => {
    const { result } = renderHook(() => useCountUp(121, true, 800));

    act(() => vi.advanceTimersByTime(2000));

    expect(result.current).toBe(121);
  });

  it('동작 줄이기를 켠 기기에선 세지 않고 최종값이다', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));

    const { result } = renderHook(() => useCountUp(121, true, 800));

    expect(result.current).toBe(121);
    vi.unstubAllGlobals();
  });
});
