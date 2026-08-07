// 달력 훅 검증 — 첫 조회는 서버가 달을 정하고, 월 이동은 그 응답이 준 달에서 출발한다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StreakCalendarResponse } from '../api/streak';
import * as streakApi from '../api/streak';
import { useStreakCalendar } from './useStreakCalendar';

vi.mock('../api/streak', () => ({
  getStreakCalendar: vi.fn(),
  getCurrentStreak: vi.fn(),
}));

vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));

const getStreakCalendar = vi.mocked(streakApi.getStreakCalendar);

const calendarOf = (year: number, month: number): StreakCalendarResponse => ({
  year,
  month,
  currentStreakDays: 3,
  activeToday: true,
  today: '2026-08-05',
  firstActiveDate: '2026-06-01',
  longestStreakDays: 9,
  totalActiveDays: 20,
  activeDates: [],
});

const renderCalendar = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useStreakCalendar(), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });
};

beforeEach(() => {
  getStreakCalendar.mockReset();
  // 서버는 요청한 달을, 생략하면 오늘이 든 8월을 돌려준다
  getStreakCalendar.mockImplementation((view) =>
    Promise.resolve(calendarOf(view?.year ?? 2026, view?.month ?? 8)),
  );
});

describe('useStreakCalendar', () => {
  it('첫 조회는 달을 지정하지 않는다', async () => {
    // when
    const { result } = renderCalendar();
    await waitFor(() => expect(result.current.calendar).not.toBeNull());

    // then — 기기 시계로 달을 고르지 않고 서버가 정한 달을 받는다
    expect(getStreakCalendar).toHaveBeenCalledWith(null);
    expect(result.current.calendar?.month).toBe(8);
  });

  it('월 이동은 서버가 준 달에서 출발한다', async () => {
    const { result } = renderCalendar();
    await waitFor(() => expect(result.current.calendar).not.toBeNull());

    // when — 응답이 8월이었으니 한 칸 뒤는 7월이어야 한다
    act(() => result.current.goMonth(-1));

    // then
    await waitFor(() =>
      expect(getStreakCalendar).toHaveBeenCalledWith({ year: 2026, month: 7 }),
    );
  });

  it('기본 조회로 받은 달로 되돌아오면 응답을 기다리지 않고 그린다', async () => {
    const { result } = renderCalendar();
    await waitFor(() => expect(result.current.calendar).not.toBeNull());
    act(() => result.current.goMonth(-1));
    await waitFor(() => expect(result.current.calendar?.month).toBe(7));

    // given — 8월 재조회는 영영 응답이 오지 않는다
    getStreakCalendar.mockReturnValue(new Promise(() => {}));

    // when — 8월로 돌아온다
    act(() => result.current.goMonth(1));

    // then — 기본 조회 때 그 달 키에도 심어 뒀으므로 캐시가 바로 그려진다
    expect(result.current.calendar?.month).toBe(8);
    expect(result.current.isSwitching).toBe(false);
  });
});
