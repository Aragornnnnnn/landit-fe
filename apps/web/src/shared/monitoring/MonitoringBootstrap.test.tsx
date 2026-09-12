// 로그인 사용자를 Sentry에 묶는 배선 — 마운트 시 한 번, 이후 사용자가 바뀔 때만
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { MonitoringBootstrap } from './MonitoringBootstrap';

const sentryMock = vi.hoisted(() => ({ setUser: vi.fn() }));
vi.mock('@sentry/nextjs', () => sentryMock);

const member = (userId: number) =>
  ({ userId, nickname: '준서', provider: 'GOOGLE' }) as never;

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  sentryMock.setUser.mockClear();
});
afterEach(() => cleanup());

describe('MonitoringBootstrap', () => {
  it('이미 로그인돼 있으면(세션 복원) 마운트 즉시 그 사용자를 묶는다', () => {
    useAuthStore.getState().setAuth('a', 'r', member(7));

    render(<MonitoringBootstrap />);

    expect(sentryMock.setUser).toHaveBeenCalledWith({ id: '7' });
  });

  it('비로그인 첫 방문에는 아무것도 하지 않는다', () => {
    render(<MonitoringBootstrap />);

    expect(sentryMock.setUser).not.toHaveBeenCalled();
  });

  it('로그인하면 묶고, 로그아웃하면 푼다', () => {
    render(<MonitoringBootstrap />);

    useAuthStore.getState().setAuth('a', 'r', member(7));
    expect(sentryMock.setUser).toHaveBeenLastCalledWith({ id: '7' });

    useAuthStore.getState().clearAuth();
    expect(sentryMock.setUser).toHaveBeenLastCalledWith(null);
  });

  it('같은 사용자로 토큰만 갱신되면 다시 묶지 않는다', () => {
    useAuthStore.getState().setAuth('a', 'r', member(7));
    render(<MonitoringBootstrap />);
    sentryMock.setUser.mockClear();

    useAuthStore.getState().setAuth('a2', 'r2', member(7));

    expect(sentryMock.setUser).not.toHaveBeenCalled();
  });
});
