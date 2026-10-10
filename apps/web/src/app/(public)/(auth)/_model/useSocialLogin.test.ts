// 소셜 로그인 훅 — 애플 로그인 점검 가드와, 성공한 로그인 방법을 기기에 남기는지 검증한다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readLastLoginProvider } from './last-login-provider';
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
const { postToNative, native, socialLogin } = vi.hoisted(() => ({
  postToNative: vi.fn<(message: unknown) => boolean>(() => true),
  // 네이티브가 웹으로 보내는 메시지를 테스트가 대신 흘려보낸다
  native: { emit: (() => undefined) as (message: unknown) => unknown },
  socialLogin: vi.fn(),
}));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative,
  subscribeFromNative: (listener: (message: unknown) => unknown) => {
    native.emit = listener;
    return () => {};
  },
}));
vi.mock('@/shared/auth/api/social-login', () => ({ socialLogin }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  localStorage.clear();
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

describe('useSocialLogin — 로그인한 방법 남기기', () => {
  const nativeSuccess = {
    type: 'SOCIAL_LOGIN_SUCCESS',
    provider: 'google',
    idToken: 'id',
    nonce: 'n',
  };

  it('네이티브 로그인이 백엔드 로그인까지 성공하면 그 방법을 남긴다', async () => {
    // given
    socialLogin.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { userId: 1, provider: 'GOOGLE', newUser: false },
    });
    renderHook(() => useSocialLogin());

    // when
    await act(async () => {
      await native.emit(nativeSuccess);
    });

    // then
    expect(readLastLoginProvider()).toBe('google');
  });

  it('백엔드 로그인이 실패하면 남기지 않는다', async () => {
    // given
    socialLogin.mockRejectedValue(new Error('401'));
    renderHook(() => useSocialLogin());

    // when
    await act(async () => {
      await native.emit(nativeSuccess);
    });

    // then
    expect(readLastLoginProvider()).toBeNull();
  });
});
