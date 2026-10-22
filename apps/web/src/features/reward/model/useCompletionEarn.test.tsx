// 완료 축하 화면이 받은 금액을 묻는 훅의 계약 테스트
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rewardKeys } from './keys';
import { refreshRewardAfterCompletion } from './refresh-reward';
import { rewardCompletion, rewardView } from './reward.fixture';
import { useCompletionEarn } from './useCompletionEarn';

vi.mock('../api/reward', () => ({ getMyRewards: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  getCurrentUserId: () => 42,
  useAuthStore: (select: (state: unknown) => unknown) =>
    select({ member: { userId: 42 } }),
}));

const renderWith = (queryClient: QueryClient, enabled = true) =>
  renderHook(() => useCompletionEarn({ enabled }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

// 오늘의 시나리오를 처음 끝내 500원을 받은 완료 — 적립 대상이다
const FIRST = { todaysFirst: true, receipt: rewardCompletion() };

describe('useCompletionEarn', () => {
  it('완료 순간에 적어 둔, 이번에 받은 금액을 준다', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.completionEarn(42), { earnedWon: 500 });

    const { result } = renderWith(queryClient);

    expect(result.current).toEqual({ earn: { earnedWon: 500 } });
  });

  it('적어 둔 것이 없으면 보여 줄 것이 없다', () => {
    const { result } = renderWith(new QueryClient());

    expect(result.current).toEqual({ earn: null });
  });

  it('환급이 쌓이지 않는 대화(스몰톡)의 축하에서는 앞서 끝낸 시나리오의 금액을 다시 보여 주지 않는다', () => {
    // given — 같은 날 시나리오를 끝내며 적어 둔 금액이 남아 있다
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.completionEarn(42), { earnedWon: 500 });

    const { result } = renderWith(queryClient, false);

    expect(result.current).toEqual({ earn: null });
  });
});

describe('완료 순간에 적어 둔 것', () => {
  afterEach(() => vi.useRealTimers());

  it('보는 화면이 없어도 캐시 기본 보관 시간(5분)을 넘겨 남는다 — 축하는 피드백 화면을 거쳐 간다', () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    queryClient.setQueryData(rewardKeys.summary(42), rewardView());

    refreshRewardAfterCompletion(queryClient, FIRST);
    vi.advanceTimersByTime(10 * 60 * 1000);

    expect(queryClient.getQueryData(rewardKeys.completionEarn(42))).toEqual({
      earnedWon: 500,
    });
  });
});
