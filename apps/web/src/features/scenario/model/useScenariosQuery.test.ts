// 시나리오 목록 훅 검증 — 표현학습 스킵 복귀(just) 시 서버 해금 반영 지연을 흡수하는 재조회
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScenariosQuery } from './useScenariosQuery';

const refetch = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({
    data: undefined,
    error: null,
    isPending: true,
    refetch,
  }),
}));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (
    selector: (state: { member: { userId: number } }) => unknown,
  ) => selector({ member: { userId: 1 } }),
}));

describe('useScenariosQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refetch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('스킵 복귀(just)로 왔으면 일정 시간 뒤 한 번 더 물어본다 — 서버 해금 반영 지연을 흡수', () => {
    renderHook(() => useScenariosQuery(null, { justReturned: true }));

    expect(refetch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('일반 진입이면 추가로 다시 묻지 않는다', () => {
    renderHook(() => useScenariosQuery(null));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(refetch).not.toHaveBeenCalled();
  });

  it('마운트 뒤 신호가 바뀌어도(소비돼 꺼져도) 처음 신호대로 재조회한다', () => {
    const { rerender } = renderHook(
      ({ justReturned }) => useScenariosQuery(null, { justReturned }),
      { initialProps: { justReturned: true } },
    );

    rerender({ justReturned: false }); // useReturnSignals가 소비 후 신호를 비우는 것과 동일한 상황

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
