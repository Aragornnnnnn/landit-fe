// 급함 시계 훅의 계약 테스트 — 초마다가 아니라 급함이 바뀌는 순간에만 값이 바뀐다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMidnightUrgent } from './useMidnightUrgent';

const HOUR = 60 * 60 * 1000;
// 2026-10-10의 한국 시각
const kst = (hour: number, minute = 0, second = 0) =>
  Date.UTC(2026, 9, 10, hour - 9, minute, second);
const pass = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useMidnightUrgent', () => {
  it('자정 여섯 시간 전이 되는 순간 급해진다', () => {
    vi.setSystemTime(kst(17, 59, 59));
    const { result } = renderHook(() => useMidnightUrgent(true));
    expect(result.current).toBe(false);

    pass(1000);

    expect(result.current).toBe(true);
  });

  it('자정이 지나면 풀린다', () => {
    vi.setSystemTime(kst(23, 59, 59));
    const { result } = renderHook(() => useMidnightUrgent(true));
    expect(result.current).toBe(true);

    pass(2000);

    expect(result.current).toBe(false);
  });

  it('하루가 지나도 다음 경계마다 다시 깨어난다', () => {
    vi.setSystemTime(kst(17, 59, 59));
    const { result } = renderHook(() => useMidnightUrgent(true));

    // 급해짐 → 자정에 풀림 → 다음 날 저녁에 다시 급해짐
    pass(1000 + 6 * HOUR);
    expect(result.current).toBe(false);
    pass(18 * HOUR);

    expect(result.current).toBe(true);
  });

  it('앱이 뒤에 가 있던 동안 경계를 넘겼으면 돌아온 순간 바로잡는다', () => {
    // given — 타이머가 멈춘 채 시각만 흘렀다
    vi.setSystemTime(kst(17));
    const { result } = renderHook(() => useMidnightUrgent(true));
    vi.setSystemTime(kst(19));

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(true);
  });

  it('꺼 둔 동안은 급한 시각이어도 false다', () => {
    vi.setSystemTime(kst(20));

    const { result } = renderHook(() => useMidnightUrgent(false));

    expect(result.current).toBe(false);
  });

  it('꺼져 있다 켜지면 예전이 아니라 그 순간의 급함을 본다', () => {
    // given — 저녁에 열어 둔 채 다음 날 아침이 됐다
    vi.setSystemTime(kst(20));
    const { result, rerender } = renderHook(
      ({ enabled }) => useMidnightUrgent(enabled),
      { initialProps: { enabled: false } },
    );
    pass(12 * HOUR);

    rerender({ enabled: true });

    expect(result.current).toBe(false);
  });
});
