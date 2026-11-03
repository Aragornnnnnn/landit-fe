// 롤플레이 입구 — 페이월에 잠긴 사용자도 무료 기회가 남았으면 들여보내는지 검증
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getRoleplayAccess } from '../api/roleplay';
import { useRoleplayGate } from './useRoleplayGate';

const paywall = vi.hoisted(() => ({ locked: true, guard: vi.fn() }));

vi.mock('../api/roleplay', () => ({ getRoleplayAccess: vi.fn() }));
vi.mock('@/shared/auth/current-member', () => ({
  useCurrentUserId: () => 39,
}));
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => paywall,
}));

const access = (canStart: boolean) => ({
  enabled: true,
  premium: false,
  freeTrialAvailable: canStart,
  canStart,
});

const setup = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useRoleplayGate(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
};

const options = { source: 'roleplay' as const, returnTo: '/roleplay' };

beforeEach(() => {
  paywall.locked = true;
  paywall.guard.mockReset();
  vi.mocked(getRoleplayAccess).mockReset();
});

afterEach(cleanup);

describe('useRoleplayGate', () => {
  it('무료 기회가 남았으면 페이월 없이 들여보낸다', async () => {
    // Given 무료 기회가 남은 무료 사용자가
    vi.mocked(getRoleplayAccess).mockResolvedValue(access(true));
    const { result } = setup();
    await waitFor(() => expect(getRoleplayAccess).toHaveBeenCalled());
    await waitFor(() => expect(result.current.deciding).toBe(false));
    const go = vi.fn();

    // When 시작하면
    result.current.guard(go, options);

    // Then 페이월을 거치지 않고 간다
    expect(go).toHaveBeenCalledTimes(1);
    expect(paywall.guard).not.toHaveBeenCalled();
    expect(result.current.locked).toBe(false);
  });

  it('무료 기회를 다 썼으면 페이월 게이트에 맡긴다', async () => {
    vi.mocked(getRoleplayAccess).mockResolvedValue(access(false));
    const { result } = setup();
    await waitFor(() => expect(result.current.locked).toBe(true));
    const go = vi.fn();

    result.current.guard(go, options);

    expect(go).not.toHaveBeenCalled();
    expect(paywall.guard).toHaveBeenCalledWith(go, options);
  });

  it('무료 기회를 알 수 없으면 페이월 게이트에 맡긴다', async () => {
    // Given 구 서버라 조회가 실패해도 지금과 같이 동작한다
    vi.mocked(getRoleplayAccess).mockRejectedValue(new Error('404'));
    const { result } = setup();
    await waitFor(() => expect(result.current.locked).toBe(true));

    expect(result.current.locked).toBe(true);
  });

  it('응답 전에는 잠그지 않는다 — 시작하면 서버가 최종 판단한다', () => {
    vi.mocked(getRoleplayAccess).mockReturnValue(new Promise(() => {}));
    const { result } = setup();
    const go = vi.fn();

    result.current.guard(go, options);

    expect(go).toHaveBeenCalledTimes(1);
    expect(result.current.deciding).toBe(true);
  });

  it('페이월이 열린 사용자는 무료 기회를 묻지 않는다', () => {
    paywall.locked = false;
    const { result } = setup();
    const go = vi.fn();

    result.current.guard(go, options);

    expect(getRoleplayAccess).not.toHaveBeenCalled();
    expect(paywall.guard).toHaveBeenCalledWith(go, options);
  });
});
