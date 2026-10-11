// 완료 축하 화면이 받은 금액을 묻는 훅의 계약 테스트
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as rewardApi from '../api/reward';
import { rewardKeys } from './keys';
import { refreshRewardAfterCompletion } from './refresh-reward';
import { rewardActivity, rewardToday, rewardView } from './reward.fixture';
import { useCompletionEarn } from './useCompletionEarn';

vi.mock('../api/reward', () => ({ getMyRewards: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  getCurrentUserId: () => 42,
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ member: { userId: 42 } }),
}));

const getMyRewards = vi.mocked(rewardApi.getMyRewards);
const afterScenario = rewardView({
  today: rewardToday({
    earnedWon: 111,
    activities: [
      rewardActivity('SCENARIO', {
        earnedWon: 111,
        completed: true,
        completedCount: 1,
        remainingWon: 0,
      }),
      rewardActivity('EXPRESSION'),
      rewardActivity('SMALLTALK'),
    ],
  }),
});

const renderWith = (queryClient: QueryClient) =>
  renderHook(() => useCompletionEarn(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

beforeEach(() => {
  getMyRewards.mockReset();
  getMyRewards.mockResolvedValue(afterScenario);
});

describe('useCompletionEarn', () => {
  it('새 금액을 받는 동안은 기다리라고 하고, 받으면 이번에 받은 금액을 준다', async () => {
    // given — 완료 직전에 적어 둔 것이 있고, 받아 둔 환급은 아직 완료 전의 것이다
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.summary(42), rewardView());
    queryClient.setQueryData(rewardKeys.earnBase(42), {
      date: '2026-10-10',
      activityType: 'SCENARIO',
    });
    void queryClient.invalidateQueries({ queryKey: rewardKeys.summary(42) });

    const { result } = renderWith(queryClient);

    expect(result.current).toEqual({ earn: null, pending: true });
    await waitFor(() => expect(result.current.earn?.earnedWon).toBe(111));
    expect(result.current.pending).toBe(false);
  });

  it('적어 둔 것이 없으면 묻지도 기다리지도 않는다', () => {
    const { result } = renderWith(new QueryClient());

    expect(result.current).toEqual({ earn: null, pending: false });
    expect(getMyRewards).not.toHaveBeenCalled();
  });
});

describe('완료 직전에 적어 둔 것', () => {
  afterEach(() => vi.useRealTimers());

  it('보는 화면이 없어도 캐시 기본 보관 시간(5분)을 넘겨 남는다 — 스몰톡은 요약 화면을 거쳐 축하로 간다', () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.summary(42), rewardView());

    refreshRewardAfterCompletion(queryClient, 'SMALLTALK');
    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(queryClient.getQueryData(rewardKeys.earnBase(42))).toEqual({
      date: '2026-10-10',
      activityType: 'SMALLTALK',
    });
  });
});
