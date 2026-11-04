// 끝난 대화 조회 — 교정을 만드는 동안 다시 묻고, 다 만들어지면 멈춘다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CORRECTION_WAIT_LIMIT_MS } from '@/features/small-talk/model/useSmallTalkSessionQuery';

import {
  getRoleplaySession,
  type RoleplayHistoryDetail,
} from '../api/roleplay';
import { useRoleplaySessionQuery } from './useRoleplaySessionQuery';

vi.mock('../api/roleplay', () => ({ getRoleplaySession: vi.fn() }));
vi.mock('@/shared/auth/current-member', () => ({
  useCurrentUserId: () => 39,
}));

const detail = (status: 'PREPARING' | 'COMPLETED') =>
  ({
    messages: [{ messageId: 1, correction: { status, sentence: null } }],
  }) as unknown as RoleplayHistoryDetail;

const setup = () => {
  const client = new QueryClient();
  return renderHook(() => useRoleplaySessionQuery(7), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
};

beforeEach(() => {
  vi.mocked(getRoleplaySession).mockReset();
});

describe('useRoleplaySessionQuery', () => {
  it('교정을 만드는 중이면 다 만들어질 때까지 다시 묻는다', async () => {
    vi.mocked(getRoleplaySession)
      .mockResolvedValueOnce(detail('PREPARING'))
      .mockResolvedValue(detail('COMPLETED'));

    const { result } = setup();

    await waitFor(
      () =>
        expect(result.current.session?.messages[0].correction?.status).toBe(
          'COMPLETED',
        ),
      { timeout: 3_000 },
    );
    expect(result.current.waitExpired).toBe(false);
  });

  it('교정이 늦어져도 서버의 분석 마감까지 계속 묻고, 그 뒤에 멈춘다', async () => {
    // Given 교정이 끝나지 않는 대화에서
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(getRoleplaySession).mockResolvedValue(detail('PREPARING'));
    const { result } = setup();
    await waitFor(() => expect(result.current.session).not.toBeNull());

    // When 1분을 넘겨도 아직 기다리고
    await act(() => vi.advanceTimersByTimeAsync(61_000));
    expect(result.current.waitExpired).toBe(false);

    // Then 분석 마감을 넘기면 멈춘다
    await act(() => vi.advanceTimersByTimeAsync(CORRECTION_WAIT_LIMIT_MS));
    expect(result.current.waitExpired).toBe(true);
    vi.useRealTimers();
  });

  it('교정이 다 만들어져 있으면 다시 묻지 않는다', async () => {
    vi.mocked(getRoleplaySession).mockResolvedValue(detail('COMPLETED'));

    const { result } = setup();

    await waitFor(() => expect(result.current.session).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect(getRoleplaySession).toHaveBeenCalledTimes(1);
  });
});
