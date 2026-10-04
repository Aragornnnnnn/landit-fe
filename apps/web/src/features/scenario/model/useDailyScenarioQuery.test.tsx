// 날짜별 시나리오 조회 계약 검증 — 날짜를 옮기면 이전 날 카드를 붙들지 않는다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getDailyScenario, type DailyScenarioResponse } from '../api/daily';
import { useDailyScenarioQuery } from './useDailyScenarioQuery';

vi.mock('../api/daily', () => ({ getDailyScenario: vi.fn() }));

const mockGet = vi.mocked(getDailyScenario);

const response = (date: string) =>
  ({ date, playable: true, scenario: null }) as DailyScenarioResponse;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  useAuthStore.setState({
    member: { userId: 1, nickname: null, email: null, provider: 'KAKAO' },
  });
});

afterEach(() => {
  cleanup();
  useAuthStore.setState({ member: null });
});

describe('useDailyScenarioQuery', () => {
  it('날짜를 옮기면 새 날 응답이 오기 전까지 이전 날 카드를 내주지 않는다', async () => {
    // Given 9월 17일 카드를 받아 둔 상태에서
    mockGet.mockImplementation((date) =>
      date === '2026-09-17'
        ? Promise.resolve(response('2026-09-17'))
        : new Promise(() => {}),
    );
    const { result, rerender } = renderHook(
      ({ date }) => useDailyScenarioQuery(date),
      { wrapper, initialProps: { date: '2026-09-17' } },
    );
    await waitFor(() => expect(result.current.daily?.date).toBe('2026-09-17'));

    // When 응답이 아직 안 온 9월 18일로 옮기면
    rerender({ date: '2026-09-18' });

    // Then 17일 카드 대신 빈 값(로딩)을 내준다
    expect(result.current.daily).toBeNull();
  });
});
