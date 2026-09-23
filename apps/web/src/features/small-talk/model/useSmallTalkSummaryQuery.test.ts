// 오늘의 스몰톡 요약 조회 훅 — 표현 재사용·후속 질문은 종료 후 잡이 만들어서, 준비될 때까지 다시 물어야 한다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SmallTalkSummaryResponse } from '../api/small-talk';
import * as smallTalkApi from '../api/small-talk';
import { smallTalkKeys } from './keys';
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
  summaryPending = false,
  expressionsPending = false,
  followUpPending = false,
} = {}): SmallTalkSummaryResponse => ({
  sessionId: 7,
  title: '카페 얘기',
  pending: summaryPending,
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
    triggerType: 'CONCERN',
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
    ['총평이', { summaryPending: true }],
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

  it('폴링이 한 번 실패해도 이미 받아 둔 요약은 사라지지 않는다', async () => {
    // Given 요약은 받아 뒀고, 그 뒤 폴링 한 번이 끊긴 상황
    getSmallTalkSummary.mockResolvedValueOnce(
      summaryOf({ expressionsPending: true }),
    );
    getSmallTalkSummary.mockRejectedValue(new Error('네트워크가 끊겼어요'));
    const { result } = renderSummary();
    await waitFor(() => expect(result.current.summary).not.toBeNull());

    await waitFor(() =>
      expect(getSmallTalkSummary.mock.calls.length).toBeGreaterThan(1),
    );

    // Then 보고 있던 요약은 그대로 있고 실패는 화면에 올라가지 않는다
    expect(result.current.summary).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('미리 받아 두기가 실패한 뒤 도착하면, 다시 받아오는 동안은 실패 대신 기다린다', async () => {
    // Given 대화 끝에 건 프리페치가 실패해 캐시에 실패만 남은 상태 — 화면은 그 뒤에 열린다
    getSmallTalkSummary.mockRejectedValueOnce(new Error('네트워크가 끊겼어요'));
    getSmallTalkSummary.mockResolvedValue(summaryOf());
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await client
      .prefetchQuery({
        queryKey: smallTalkKeys.summary(42, 7),
        queryFn: () => smallTalkApi.getSmallTalkSummary(7),
      })
      .catch(() => {});

    // When 요약 화면이 열리면
    const { result } = renderHook(() => useSmallTalkSummaryQuery(7), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children),
    });

    // Then 실패 화면 대신 기다리는 화면을 보여주다가 요약이 도착한다
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.summary).not.toBeNull());
  });

  it('받아 둔 것 없이 실패하면 그때는 실패를 알린다', async () => {
    getSmallTalkSummary.mockRejectedValue(new Error('불러오지 못했어요'));
    const { result } = renderSummary();

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isLoading).toBe(false);
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
