// 오늘의 스몰톡 요약 조회 훅 — 표현 재사용·후속 질문은 종료 후 잡이 만들어서, 준비될 때까지 다시 물어야 한다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SmallTalkSummaryResponse } from '../api/small-talk';
import * as smallTalkApi from '../api/small-talk';
import {
  SUMMARY_WAIT_LIMIT_MS,
  useSmallTalkSummaryQuery,
} from './useSmallTalkSummaryQuery';

vi.mock('../api/small-talk', () => ({
  getSmallTalkSummary: vi.fn(),
}));

vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));

const getSmallTalkSummary = vi.mocked(smallTalkApi.getSmallTalkSummary);

const summaryOf = ({
  expressionsPending = false,
  followUpPending = false,
} = {}): SmallTalkSummaryResponse => ({
  sessionId: 7,
  title: '카페 얘기',
  firstSession: false,
  headline: {
    text: '지난번보다 1분 24초 더 말했어요!',
    subline: '할 말이 그만큼 늘었다는 거예요.',
    pose: 'POINT',
  },
  comparison: {
    previousSessionId: 6,
    previousDate: '2026-09-10',
    current: { speakingMs: 245_000, turnCount: 18, maxWordsInTurn: 23 },
    previous: { speakingMs: 161_000, turnCount: 14, maxWordsInTurn: 12 },
  },
  growth: null,
  reusedExpressions: { pending: expressionsPending, items: [] },
  followUp: {
    pending: followUpPending,
    triggerType: 'NONE',
    question: '다음엔 요즘 빠져 있는 거 얘기해줘.',
    invite: '기억해둘게.',
  },
  correctionCount: 3,
});

const renderSummary = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useSmallTalkSummaryQuery(7), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useSmallTalkSummaryQuery', () => {
  it.each([
    ['표현 재사용이', { expressionsPending: true }],
    ['후속 질문이', { followUpPending: true }],
  ])('%s 아직이면 다시 묻는다', async (_, pending) => {
    getSmallTalkSummary.mockResolvedValue(summaryOf(pending));
    const { result } = renderSummary();
    await waitFor(() => expect(result.current.summary).not.toBeNull());

    await waitFor(
      () => expect(getSmallTalkSummary.mock.calls.length).toBeGreaterThan(1),
      { timeout: 3_000 },
    );
  });

  it('둘 다 준비됐으면 그만 묻는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getSmallTalkSummary.mockResolvedValue(summaryOf());
    const { result } = renderSummary();
    await waitFor(() => expect(result.current.summary).not.toBeNull());

    const callsAfterFirstLoad = getSmallTalkSummary.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(getSmallTalkSummary).toHaveBeenCalledTimes(callsAfterFirstLoad);
  });

  it('상한까지 기다려도 안 오면 그만 묻고, 기다림이 끝났다고 알린다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getSmallTalkSummary.mockResolvedValue(
      summaryOf({ expressionsPending: true }),
    );
    const { result } = renderSummary();
    await waitFor(() => expect(result.current.summary).not.toBeNull());

    await act(() => vi.advanceTimersByTimeAsync(SUMMARY_WAIT_LIMIT_MS + 1_000));

    const callsAtLimit = getSmallTalkSummary.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(getSmallTalkSummary).toHaveBeenCalledTimes(callsAtLimit);
    expect(result.current.waitExpired).toBe(true);
  });
});
