// 시나리오 삭제 — 지우면 카드가 바로 빠지고, 이미 지워진 시나리오도 지운 것으로 친다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/shared/api/api-error';

import { deleteRoleplay, type RoleplaySettings } from '../api/roleplay';
import { roleplayKeys } from './keys';
import { useDeleteRoleplayScenarioMutation } from './useDeleteRoleplayScenarioMutation';

vi.mock('../api/roleplay', () => ({ deleteRoleplay: vi.fn() }));
vi.mock('@/shared/auth/current-member', () => ({
  useCurrentUserId: () => 39,
}));

const KEY = roleplayKeys.scenarios(39);
const card = (id: number) => ({ id }) as RoleplaySettings;

const setup = () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  client.setQueryData(KEY, [card(1), card(2)]);
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const { result } = renderHook(() => useDeleteRoleplayScenarioMutation(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { client, invalidate, result };
};

const ids = (client: QueryClient) =>
  client.getQueryData<RoleplaySettings[]>(KEY)?.map(({ id }) => id);

beforeEach(() => {
  vi.mocked(deleteRoleplay).mockReset();
});

describe('useDeleteRoleplayScenarioMutation', () => {
  it('지우면 목록을 다시 받기 전에 카드를 뺀다', async () => {
    vi.mocked(deleteRoleplay).mockResolvedValue(undefined);
    const { client, result } = setup();

    await act(() => result.current.mutateAsync(1));

    expect(ids(client)).toEqual([2]);
  });

  it('목록을 다시 받는 동안 삭제 완료를 붙잡아 두지 않는다', async () => {
    vi.mocked(deleteRoleplay).mockResolvedValue(undefined);
    const { client, result } = setup();
    client.invalidateQueries = vi.fn(() => new Promise<void>(() => {}));

    await act(() => result.current.mutateAsync(1));

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('이미 지워진 시나리오(404)는 지운 것으로 친다', async () => {
    vi.mocked(deleteRoleplay).mockRejectedValue(
      new ApiError('없음', 404, '/api/v1/roleplays/1'),
    );
    const { client, result } = setup();

    await act(() => result.current.mutateAsync(1));

    expect(ids(client)).toEqual([2]);
  });

  it('그 밖의 실패는 알리고 목록을 다시 받아 맞춘다', async () => {
    vi.mocked(deleteRoleplay).mockRejectedValue(
      new ApiError('오류', 500, '/api/v1/roleplays/1'),
    );
    const { client, invalidate, result } = setup();

    await act(() => result.current.mutateAsync(1).catch(() => {}));

    expect(ids(client)).toEqual([1, 2]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: KEY });
  });
});
