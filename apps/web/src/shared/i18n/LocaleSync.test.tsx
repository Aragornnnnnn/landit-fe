// LocaleSync — 로그인 상태가 되면 화면 언어를 서버 프로필에 맞추는 계약 검증
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { updateUserLocale } from './api/user-locale';
import { LocaleSync } from './LocaleSync';

vi.mock('./api/user-locale', () => ({
  updateUserLocale: vi.fn(() => Promise.resolve(null)),
}));
const updateUserLocaleMock = vi.mocked(updateUserLocale);

const flag = vi.hoisted(() => ({ JAPANESE_ENABLED: true }));
vi.mock('./japanese-flag', () => flag);

const signIn = (userId: number) =>
  act(() =>
    useAuthStore.getState().setAuth('access', 'refresh', { userId } as never),
  );

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
  document.documentElement.lang = '';
  flag.JAPANESE_ENABLED = true;
});

describe('LocaleSync', () => {
  it('로그인 전에는 보내지 않는다', () => {
    render(<LocaleSync />);

    expect(updateUserLocaleMock).not.toHaveBeenCalled();
  });

  it('로그인되면 화면 언어(html lang)를 보낸다', () => {
    document.documentElement.lang = 'ja';
    render(<LocaleSync />);

    signIn(1);

    expect(updateUserLocaleMock).toHaveBeenCalledWith('ja');
  });

  it('일본어 출시 스위치가 꺼져 있으면 로그인해도 보내지 않는다', () => {
    flag.JAPANESE_ENABLED = false;
    render(<LocaleSync />);

    signIn(1);

    expect(updateUserLocaleMock).not.toHaveBeenCalled();
  });

  it('다른 계정으로 바뀌면 다시 보낸다', () => {
    render(<LocaleSync />);
    signIn(1);

    signIn(2);

    expect(updateUserLocaleMock).toHaveBeenCalledTimes(2);
  });
});
