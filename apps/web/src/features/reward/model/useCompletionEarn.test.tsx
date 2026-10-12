// 완료 축하 화면이 받은 금액을 묻는 훅의 계약 테스트
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as rewardApi from '../api/reward';
import { rewardKeys } from './keys';
import { refreshRewardAfterCompletion } from './refresh-reward';
import { earnedRewardToday, rewardView } from './reward.fixture';
import { useCompletionEarn } from './useCompletionEarn';

vi.mock('../api/reward', () => ({ getMyRewards: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  getCurrentUserId: () => 42,
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ member: { userId: 42 } }),
}));

const getMyRewards = vi.mocked(rewardApi.getMyRewards);
const afterScenario = rewardView({ today: earnedRewardToday() });

const renderWith = (queryClient: QueryClient, enabled = true) =>
  renderHook(() => useCompletionEarn({ enabled }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

beforeEach(() => {
  getMyRewards.mockReset();
  getMyRewards.mockResolvedValue(afterScenario);
});

// 오늘의 시나리오를 처음 끝낸 완료 — 적립 대상이다
const FIRST = { todaysFirst: true };

describe('useCompletionEarn', () => {
  it('새 금액을 받는 동안은 기다리라고 하고, 받으면 이번에 받은 금액을 준다', async () => {
    // given — 완료 직전에 적어 둔 것이 있고, 받아 둔 환급은 아직 완료 전의 것이다
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.summary(42), rewardView());
    queryClient.setQueryData(rewardKeys.earnBase(42), { date: '2026-10-10' });
    void queryClient.invalidateQueries({ queryKey: rewardKeys.summary(42) });

    const { result } = renderWith(queryClient);

    expect(result.current).toEqual({ earn: null, pending: true });
    await waitFor(() => expect(result.current.earn?.earnedWon).toBe(500));
    expect(result.current.pending).toBe(false);
  });

  it('적어 둔 것이 없으면 묻지도 기다리지도 않는다', () => {
    const { result } = renderWith(new QueryClient());

    expect(result.current).toEqual({ earn: null, pending: false });
    expect(getMyRewards).not.toHaveBeenCalled();
  });

  it('환급이 쌓이지 않는 대화(스몰톡)의 축하에서는 앞서 끝낸 시나리오의 금액을 다시 보여 주지 않는다', () => {
    // given — 같은 날 시나리오를 끝내며 적어 둔 것과 그때 받은 금액이 남아 있다
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.summary(42), afterScenario);
    queryClient.setQueryData(rewardKeys.earnBase(42), { date: '2026-10-10' });

    const { result } = renderWith(queryClient, false);

    expect(result.current).toEqual({ earn: null, pending: false });
    expect(getMyRewards).not.toHaveBeenCalled();
  });
});

describe('완료 직전에 적어 둔 것', () => {
  afterEach(() => vi.useRealTimers());

  it('보는 화면이 없어도 캐시 기본 보관 시간(5분)을 넘겨 남는다 — 축하는 피드백 화면을 거쳐 간다', () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.summary(42), rewardView());

    refreshRewardAfterCompletion(queryClient, FIRST);
    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(queryClient.getQueryData(rewardKeys.earnBase(42))).toEqual({
      date: '2026-10-10',
    });
  });
});
