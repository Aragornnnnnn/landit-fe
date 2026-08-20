// useSatisfactionSheet — 홈 탭에 돌아왔을 때 어느 시트를 하나만 띄울지 고르는 규칙 검증
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  consumeAllTalkPending,
  markTalkCompleted,
  PROMPT_RECORD_KEY,
  recordSatisfactionAnswer,
} from '@/features/satisfaction/model/prompt-record';
import * as streakApi from '@/features/streak/api/streak';
import type { StreakCalendarResponse } from '@/features/streak/api/streak';

import { useSatisfactionSheet } from './useSatisfactionSheet';

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

const renderSheet = (talk: 'scenario' | 'smalltalk' = 'scenario') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useSatisfactionSheet(talk), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });
};

// 지난 날 좋았다고 답한 뒤, 다른 날 다시 와서 대화를 마친 상태
const cameBackAfterGood = (talk: 'scenario' | 'smalltalk' = 'scenario') => {
  markTalkCompleted(talk);
  recordSatisfactionAnswer(talk, 'good');
  const all = JSON.parse(localStorage.getItem(PROMPT_RECORD_KEY)!);
  all[`satisfaction:${talk}`].answeredOn = '2000-01-01';
  localStorage.setItem(PROMPT_RECORD_KEY, JSON.stringify(all));
  consumeAllTalkPending();
  markTalkCompleted(talk);
};

beforeEach(() => {
  localStorage.clear();
  getStreakCalendar.mockReset();
});

describe('useSatisfactionSheet', () => {
  it('그 대화를 처음 마쳤으면 소감 시트다 — 스트릭은 묻지도 않는다', () => {
    markTalkCompleted('scenario');

    const { result } = renderSheet();

    expect(result.current.sheet).toBe('talk');
    expect(getStreakCalendar).not.toHaveBeenCalled();
  });

  it('좋았다고 했던 사람이 다른 날 또 대화를 마쳤으면 리뷰 요청이다', async () => {
    cameBackAfterGood();
    getStreakCalendar.mockResolvedValue(calendar());

    const { result } = renderSheet();

    // 달력을 받기 전엔 아직 고르지 못한다
    expect(result.current).toEqual({ sheet: null, settled: false });
    await waitFor(() => expect(result.current.sheet).toBe('review'));
  });

  it('스몰톡 탭에서도 리뷰 요청이 뜬다 — 대화 종류를 가리지 않는다', async () => {
    cameBackAfterGood('smalltalk');
    getStreakCalendar.mockResolvedValue(calendar());

    const { result } = renderSheet('smalltalk');

    await waitFor(() => expect(result.current.sheet).toBe('review'));
  });

  it('첫 완료일이면 아무 시트도 띄우지 않는다', async () => {
    cameBackAfterGood();
    getStreakCalendar.mockResolvedValue(calendar({ totalActiveDays: 1 }));

    const { result } = renderSheet();

    await waitFor(() =>
      expect(result.current).toEqual({ sheet: null, settled: true }),
    );
  });

  it('좋았다고 한 적이 없으면 스트릭을 조회하지 않는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'bad');
    consumeAllTalkPending();
    markTalkCompleted('scenario');

    const { result } = renderSheet();

    expect(result.current).toEqual({ sheet: null, settled: true });
    expect(getStreakCalendar).not.toHaveBeenCalled();
  });

  it('스트릭 조회가 실패하면 리뷰 요청은 포기한다', async () => {
    cameBackAfterGood();
    getStreakCalendar.mockRejectedValue(new Error('network'));

    const { result } = renderSheet();

    // 한 번 재시도한 뒤 포기한다 — 그만큼 기다린다
    await waitFor(
      () => expect(result.current).toEqual({ sheet: null, settled: true }),
      { timeout: 3000 },
    );
  });

  it('한 번 고른 답은 리렌더돼도 바뀌지 않는다 — 시트가 뜨며 차례가 소비돼도 그대로다', async () => {
    cameBackAfterGood();
    getStreakCalendar.mockResolvedValue(calendar());
    const { result, rerender } = renderSheet();
    await waitFor(() => expect(result.current.sheet).toBe('review'));

    consumeAllTalkPending();
    rerender();

    expect(result.current.sheet).toBe('review');
  });
});
