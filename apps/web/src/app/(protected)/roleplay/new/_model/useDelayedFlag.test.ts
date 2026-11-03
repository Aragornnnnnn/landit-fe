// useDelayedFlag — 이어져야 켜지고, 꺼지면 바로 꺼진다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDelayedFlag } from './useDelayedFlag';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDelayedFlag', () => {
  it('시간이 차기 전엔 false다', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 300));

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe(false);
  });

  it('시간이 차면 true가 된다', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 300));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(true);
  });

  it('끄면 바로 false이고, 다시 켜면 처음부터 기다린다', () => {
    const { result, rerender } = renderHook(
      ({ on }) => useDelayedFlag(on, 300),
      { initialProps: { on: true } },
    );
    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender({ on: false });
    expect(result.current).toBe(false);

    rerender({ on: true });
    expect(result.current).toBe(false);
  });
});
