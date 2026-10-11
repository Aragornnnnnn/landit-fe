// 로그인 사용자 IDENTIFY 배선 — 셸일 때만, 사용자가 바뀔 때만 보낸다
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { IdentifySync } from './IdentifySync';

const mocks = vi.hoisted(() => ({
  getNativeContext: vi.fn(),
  post: vi.fn(() => true),
}));

vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: mocks.getNativeContext,
}));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: mocks.post,
}));

const member = (userId: number) =>
  ({ userId, nickname: '준서', provider: 'GOOGLE' }) as never;

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  mocks.getNativeContext.mockReturnValue({
    platform: 'ios',
    appVersion: '1.3.0',
    buildNumber: '6',
    bridgeVersion: 5,
  });
});
afterEach(() => cleanup());

describe('IdentifySync', () => {
  it('이미 로그인돼 있으면 마운트 즉시 그 사용자를 알린다', () => {
    useAuthStore.getState().setAuth('a', 'r', member(7));

    render(<IdentifySync />);

    expect(mocks.post).toHaveBeenCalledWith({ type: 'IDENTIFY', userId: '7' });
  });

  it('로그인하면 알리고, 로그아웃하면 null로 알린다', () => {
    render(<IdentifySync />);
    expect(mocks.post).not.toHaveBeenCalled();

    useAuthStore.getState().setAuth('a', 'r', member(7));
    expect(mocks.post).toHaveBeenLastCalledWith({
      type: 'IDENTIFY',
      userId: '7',
    });

    useAuthStore.getState().clearAuth();
    expect(mocks.post).toHaveBeenLastCalledWith({
      type: 'IDENTIFY',
      userId: null,
    });
  });

  it('같은 사용자로 토큰만 갱신되면 다시 보내지 않는다', () => {
    useAuthStore.getState().setAuth('a', 'r', member(7));
    render(<IdentifySync />);
    mocks.post.mockClear();

    useAuthStore.getState().setAuth('a2', 'r2', member(7));

    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('브라우저나 결제 메시지를 모르는 셸에는 보내지 않는다', () => {
    mocks.getNativeContext.mockReturnValue(null);
    useAuthStore.getState().setAuth('a', 'r', member(7));

    render(<IdentifySync />);

    expect(mocks.post).not.toHaveBeenCalled();
  });
});
