// 환급 내역 조회 훅 검증 — 장을 이어 받는 길과, 첫 장 실패와 다음 장 실패를 가르는 것
// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RewardHistoryItem } from '../api/reward';
import * as rewardApi from '../api/reward';
import { useRewardHistoryQuery } from './useRewardHistoryQuery';

vi.mock('../api/reward', () => ({ getRewardHistory: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));

const getRewardHistory = vi.mocked(rewardApi.getRewardHistory);

const item = (id: string): RewardHistoryItem => ({
  id,
  type: 'EARN',
  activityType: 'EXPRESSION',
  date: '2026-10-10',
  occurredAt: '2026-10-10T08:24:11+09:00',
  amountWon: 11,
  balanceWon: 2015,
  cycleId: 7,
  completionId: 1,
});

const renderHistory = () => {
  // 다시 묻기 전의 기다림만 없앤다 — 한 번 다시 묻고 포기하는 길은 그대로 돈다
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useRewardHistoryQuery(), { wrapper });
};
const ids = (result: { current: ReturnType<typeof useRewardHistoryQuery> }) =>
  result.current.rows?.map((row) => row.id);

// 중괄호로 감싼다 — 목 함수를 그대로 돌려주면 테스트 뒤 정리 함수로 불려, 실패하도록 심어 둔 응답이 테스트를 깨뜨린다
beforeEach(() => {
  getRewardHistory.mockReset();
});

describe('useRewardHistoryQuery', () => {
  it('첫 장은 커서 없이 묻고, 더 받을 것이 있다고 알린다', async () => {
    getRewardHistory.mockResolvedValue({
      items: [item('2')],
      nextCursor: 'p2',
    });

    const { result } = renderHistory();

    await waitFor(() => expect(ids(result)).toEqual(['2']));
    expect(getRewardHistory).toHaveBeenCalledWith(null);
    expect(result.current.hasMore).toBe(true);
  });

  it('이어 받으면 서버가 준 커서로 묻고 줄을 뒤에 붙인다', async () => {
    getRewardHistory
      .mockResolvedValueOnce({ items: [item('2')], nextCursor: 'p2' })
      .mockResolvedValueOnce({ items: [item('1')], nextCursor: null });
    const { result } = renderHistory();
    await waitFor(() => expect(ids(result)).toEqual(['2']));

    act(() => result.current.loadMore());

    await waitFor(() => expect(ids(result)).toEqual(['2', '1']));
    expect(getRewardHistory).toHaveBeenLastCalledWith('p2');
    expect(result.current.hasMore).toBe(false);
  });

  it('장 사이에 같은 줄이 겹쳐 와도 한 번만 준다', async () => {
    getRewardHistory
      .mockResolvedValueOnce({ items: [item('2')], nextCursor: 'p2' })
      .mockResolvedValueOnce({
        items: [item('2'), item('1')],
        nextCursor: null,
      });
    const { result } = renderHistory();
    await waitFor(() => expect(ids(result)).toEqual(['2']));

    act(() => result.current.loadMore());

    await waitFor(() => expect(ids(result)).toEqual(['2', '1']));
  });

  it('첫 장을 받지 못하면 실패를 알린다', async () => {
    getRewardHistory.mockRejectedValue(new Error('네트워크 오류'));

    const { result } = renderHistory();

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.rows).toBeNull();
  });

  it('다음 장만 받지 못하면 보던 내역은 그대로 두고 그 실패만 따로 알린다', async () => {
    getRewardHistory
      .mockResolvedValueOnce({ items: [item('2')], nextCursor: 'p2' })
      .mockRejectedValue(new Error('네트워크 오류'));
    const { result } = renderHistory();
    await waitFor(() => expect(ids(result)).toEqual(['2']));

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.moreFailed).toBe(true));
    expect(result.current.error).toBeNull();
    expect(ids(result)).toEqual(['2']);
  });
});
