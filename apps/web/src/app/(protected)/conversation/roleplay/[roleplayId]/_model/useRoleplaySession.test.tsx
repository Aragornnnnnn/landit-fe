// 롤플레이 세션 시작 — 지워진 시나리오로 시작하면 홈의 옛 카드를 걷어 내게 한다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  startSavedRoleplaySession,
  type RoleplaySessionStartResponse,
} from '@/features/roleplay/api/roleplay';
import { roleplayKeys } from '@/features/roleplay/model/keys';
import { ApiError } from '@/shared/api/api-error';

import { useRoleplaySession } from './useRoleplaySession';

vi.mock('@/features/roleplay/api/roleplay', () => ({
  startSavedRoleplaySession: vi.fn(),
}));
vi.mock('@/shared/auth/current-member', () => ({
  useCurrentUserId: () => 39,
}));
vi.mock('@/shared/monitoring/report', () => ({ reportError: vi.fn() }));
const track = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track }));
const gate = vi.hoisted(() => ({ freeUser: false, deciding: false }));
vi.mock('@/features/roleplay/model/useRoleplayGate', () => ({
  useRoleplayGate: () => gate,
}));

const startWith = (status: number) => {
  vi.mocked(startSavedRoleplaySession).mockRejectedValue(
    new ApiError('실패', status, '/api/v1/roleplays/7/sessions'),
  );
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const { result } = renderHook(() => useRoleplaySession(7), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { invalidate, result };
};

beforeEach(() => {
  vi.mocked(startSavedRoleplaySession).mockReset();
});

describe('useRoleplaySession', () => {
  it('구독을 아직 모르면 세션은 열되, 알게 된 뒤에 시작을 기록한다', async () => {
    // Given 구독 응답을 기다리는 동안
    gate.deciding = true;
    track.mockClear();
    vi.mocked(startSavedRoleplaySession).mockResolvedValue({
      sessionId: 1,
      character: { characterId: 'teddy' },
    } as unknown as RoleplaySessionStartResponse);
    const client = new QueryClient();
    const { result, rerender } = renderHook(() => useRoleplaySession(7), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    // Then 세션은 먼저 열리지만 기록은 아직 없다
    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(track).not.toHaveBeenCalled();

    // When 무료 사용자로 판정되면
    gate.deciding = false;
    gate.freeUser = true;
    rerender();

    // Then 무료 체험으로 한 번 기록한다
    await waitFor(() => expect(track).toHaveBeenCalledTimes(1));
    expect(track).toHaveBeenCalledWith(
      'Roleplay Started',
      expect.objectContaining({ free_trial: true }),
    );
    gate.freeUser = false;
  });

  it('무료 사용자의 시작은 무료 체험으로 기록하고 권한을 다시 받는다', async () => {
    // Given 무료 사용자의 시작을 서버가 받아 줄 때
    gate.freeUser = true;
    vi.mocked(startSavedRoleplaySession).mockResolvedValue({
      sessionId: 1,
      character: { characterId: 'teddy' },
    } as unknown as RoleplaySessionStartResponse);
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    // When 대화 화면이 세션을 열면
    renderHook(() => useRoleplaySession(7), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    // Then 체험으로 남기고 입구 권한을 낡은 값으로 표시한다
    await waitFor(() =>
      expect(track).toHaveBeenCalledWith(
        'Roleplay Started',
        expect.objectContaining({ free_trial: true }),
      ),
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: roleplayKeys.access(39),
    });
    gate.freeUser = false;
  });

  it('시나리오가 이미 지워졌으면(404) 목록을 다시 받게 한다', async () => {
    const { invalidate, result } = startWith(404);

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: roleplayKeys.scenarios(39),
    });
  });

  it('그 밖의 실패는 목록을 건드리지 않는다', async () => {
    const { invalidate, result } = startWith(500);

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('만들기 화면이 미리 연 세션이 있으면 다시 열지 않고 쓴다', () => {
    const client = new QueryClient();
    const started = { sessionId: 3 } as RoleplaySessionStartResponse;
    client.setQueryData(roleplayKeys.handoff(39, 7), started);

    const { result } = renderHook(() => useRoleplaySession(7), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current.session).toBe(started);
    expect(startSavedRoleplaySession).not.toHaveBeenCalled();
    expect(client.getQueryData(roleplayKeys.handoff(39, 7))).toBeUndefined();
  });
});
