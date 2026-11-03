// 끝난 대화 조회 — 교정을 만드는 동안 다시 묻고, 다 만들어지면 멈춘다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('교정이 다 만들어져 있으면 다시 묻지 않는다', async () => {
    vi.mocked(getRoleplaySession).mockResolvedValue(detail('COMPLETED'));

    const { result } = setup();

    await waitFor(() => expect(result.current.session).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 1_200));
    expect(getRoleplaySession).toHaveBeenCalledTimes(1);
  });
});
