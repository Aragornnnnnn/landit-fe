// 애플 개발자 계정 이전 중 애플 로그인만 잠시 막는 점검 가드를 검증한다
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSocialLogin } from './useSocialLogin';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ setAuth: vi.fn() }),
}));

// 네이티브 셸 안이다 — 브릿지가 요청을 받아간다
const { postToNative } = vi.hoisted(() => ({
  postToNative: vi.fn<(message: unknown) => boolean>(() => true),
}));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative,
  subscribeFromNative: () => () => {},
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useSocialLogin — 애플 로그인 점검 가드', () => {
  it('점검 중이면 애플 로그인을 시작하지 않고 안내 문구를 보여준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_APPLE_LOGIN_PAUSED', 'true');
    const { result } = renderHook(() => useSocialLogin());

    await act(async () => {
      await result.current.login('apple');
    });

    expect(postToNative).not.toHaveBeenCalled();
    expect(result.current.pending).toBeNull();
    expect(result.current.error).toBe(
      '애플 로그인을 잠시 점검하고 있어요. 잠시 후 다시 시도해 주세요.',
    );
  });

  it('점검 중이어도 다른 제공자 로그인은 그대로 진행된다', async () => {
    vi.stubEnv('NEXT_PUBLIC_APPLE_LOGIN_PAUSED', 'true');
    const { result } = renderHook(() => useSocialLogin());

    await act(async () => {
      await result.current.login('kakao');
    });

    expect(postToNative).toHaveBeenCalledWith({
      type: 'SOCIAL_LOGIN_REQUEST',
      provider: 'kakao',
    });
    expect(result.current.error).toBeNull();
  });

  it('점검 중이 아니면 애플 로그인이 그대로 진행된다', async () => {
    const { result } = renderHook(() => useSocialLogin());

    await act(async () => {
      await result.current.login('apple');
    });

    expect(postToNative).toHaveBeenCalledWith({
      type: 'SOCIAL_LOGIN_REQUEST',
      provider: 'apple',
    });
    expect(result.current.error).toBeNull();
  });
});
