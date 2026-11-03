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
  const { result } = renderHook(() => useRoleplaySession(7, 'card'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { invalidate, result };
};

beforeEach(() => {
  vi.mocked(startSavedRoleplaySession).mockReset();
  track.mockClear();
});

describe('useRoleplaySession', () => {
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
    renderHook(() => useRoleplaySession(7, 'card'), {
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

    const { result } = renderHook(() => useRoleplaySession(7, 'card'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current.session).toBe(started);
    expect(startSavedRoleplaySession).not.toHaveBeenCalled();
    expect(client.getQueryData(roleplayKeys.handoff(39, 7))).toBeUndefined();
  });

  it('시작에 실패하면 이유를 남긴다', async () => {
    const { result } = startWith(404);

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(track).toHaveBeenCalledWith('Roleplay Start Failed', {
      roleplay_id: 7,
      entry: 'card',
      reason: 'not_found',
      free_trial: false,
    });
  });

  it('구독 응답을 기다리는 동안엔 시작을 찍지 않고, 판단이 서면 그 값으로 찍는다', async () => {
    // Given 구독을 아직 못 받았을 때 세션이 열리면
    gate.deciding = true;
    vi.mocked(startSavedRoleplaySession).mockResolvedValue({
      sessionId: 1,
      character: { characterId: 'teddy' },
    } as unknown as RoleplaySessionStartResponse);
    const client = new QueryClient();
    const { result, rerender } = renderHook(
      () => useRoleplaySession(7, 'card'),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      },
    );
    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(track).not.toHaveBeenCalled();

    // When 무료 사용자로 판단이 서면
    gate.deciding = false;
    gate.freeUser = true;
    rerender();

    // Then 한 번만, 무료 체험으로 찍는다
    await waitFor(() =>
      expect(track).toHaveBeenCalledWith('Roleplay Started', {
        session_id: 1,
        roleplay_id: 7,
        partner: 'teddy',
        free_trial: true,
        entry: 'card',
      }),
    );
    expect(track).toHaveBeenCalledTimes(1);
    gate.freeUser = false;
  });

  it('만든 직후로 연 대화는 시작을 찍고 주소에서 표시를 지운다 — 새로고침은 첫 대화가 아니다', () => {
    window.history.pushState(null, '', '/conversation/roleplay/7?from=create');
    const client = new QueryClient();
    client.setQueryData(roleplayKeys.handoff(39, 7), {
      sessionId: 3,
    } as RoleplaySessionStartResponse);

    renderHook(() => useRoleplaySession(7, 'created'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    expect(track).toHaveBeenCalledWith(
      'Roleplay Started',
      expect.objectContaining({ entry: 'created' }),
    );
    expect(window.location.search).toBe('');
  });

  it('구독 판단 전이어도 세션이 열리면 무료 기회 값을 다시 받게 한다', async () => {
    gate.deciding = true;
    vi.mocked(startSavedRoleplaySession).mockResolvedValue({
      sessionId: 1,
    } as unknown as RoleplaySessionStartResponse);
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useRoleplaySession(7, 'card'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: roleplayKeys.access(39),
    });
    gate.deciding = false;
  });
});
