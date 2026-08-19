// useHomeSheet — 홈 복귀 때 어느 시트를 하나만 띄울지 고르는 규칙 검증 (첫 소감 → 랜딧 소감 → 알림 동의)
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  markTalkCompleted,
  recordSatisfactionAnswer,
} from '@/features/satisfaction/model/prompt-record';
import * as streakApi from '@/features/streak/api/streak';
import type { StreakCalendarResponse } from '@/features/streak/api/streak';

import { useHomeSheet } from './useHomeSheet';

vi.mock('@/features/streak/api/streak', () => ({
  getStreakCalendar: vi.fn(),
  getCurrentStreak: vi.fn(),
}));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
const getStreakCalendar = vi.mocked(streakApi.getStreakCalendar);

const calendar = (
  over: Partial<StreakCalendarResponse> = {},
): StreakCalendarResponse => ({
  year: 2026,
  month: 8,
  currentStreakDays: 2,
  activeToday: true,
  today: '2026-08-20',
  firstActiveDate: '2026-08-19',
  longestStreakDays: 2,
  totalActiveDays: 2,
  activeDates: ['2026-08-19', '2026-08-20'],
  ...over,
});

const renderSheet = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useHomeSheet(), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });
};

beforeEach(() => {
  localStorage.clear();
  getStreakCalendar.mockReset();
});

describe('useHomeSheet', () => {
  it('첫 시나리오 대화를 막 마쳤으면 첫 소감이다 — 스트릭은 묻지도 않는다', () => {
    markTalkCompleted('scenario');

    const { result } = renderSheet();

    expect(result.current).toBe('first-satisfaction');
    expect(getStreakCalendar).not.toHaveBeenCalled();
  });

  it('첫 소감은 이미 답했고 서버가 두 번째 완료일이라 하면 랜딧 소감이다', async () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    getStreakCalendar.mockResolvedValue(calendar());

    const { result } = renderSheet();

    // 달력을 받기 전엔 아직 고르지 못한다
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe('app-satisfaction'));
  });

  it('첫 완료일이면(totalActiveDays 1) 랜딧 소감 대신 알림 동의다', async () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    getStreakCalendar.mockResolvedValue(calendar({ totalActiveDays: 1 }));

    const { result } = renderSheet();

    await waitFor(() => expect(result.current).toBe('consent'));
  });

  it('막 마친 차례가 아니면 스트릭을 조회하지 않고 알림 동의다', () => {
    const { result } = renderSheet();

    expect(result.current).toBe('consent');
    expect(getStreakCalendar).not.toHaveBeenCalled();
  });

  it('첫 소감에서 아쉬웠다고 한 사람에겐 조회도 하지 않고 알림 동의다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'bad');

    const { result } = renderSheet();

    expect(result.current).toBe('consent');
    expect(getStreakCalendar).not.toHaveBeenCalled();
  });

  it('스트릭 조회가 실패하면 랜딧 소감은 포기하고 알림 동의다', async () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    getStreakCalendar.mockRejectedValue(new Error('network'));

    const { result } = renderSheet();

    // 한 번 재시도한 뒤 포기한다 — 그만큼 기다린다
    await waitFor(() => expect(result.current).toBe('consent'), {
      timeout: 3000,
    });
  });

  it('한 번 고른 답은 리렌더돼도 바뀌지 않는다 — 시트가 뜨며 차례가 소비돼도 알림 동의로 갈아타지 않는다', async () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    getStreakCalendar.mockResolvedValue(calendar());
    const { result, rerender } = renderSheet();
    await waitFor(() => expect(result.current).toBe('app-satisfaction'));

    // 시트가 뜨면서 차례를 소비한 상황
    localStorage.clear();
    rerender();

    expect(result.current).toBe('app-satisfaction');
  });
});
