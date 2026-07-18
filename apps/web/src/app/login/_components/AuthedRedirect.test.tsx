// AuthedRedirect — 마운트 시점에만 판단하고, 마운트 후 완료된 로그인에는 반응하지 않는지 검증
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/store/auth-store';

import { AuthedRedirect } from './AuthedRedirect';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

const member = {
  userId: 1,
  nickname: '랜디',
  email: null,
  provider: 'kakao',
};

describe('AuthedRedirect', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    mocks.replace.mockClear();
  });

  it('이미 로그인된 채 마운트되면 홈으로 보낸다', () => {
    useAuthStore.getState().setAuth('access', 'refresh', member);

    render(<AuthedRedirect />);

    expect(mocks.replace).toHaveBeenCalledWith('/home');
  });

  it('마운트 후 로그인이 완료돼도 홈으로 덮어쓰지 않는다 — 브릿지 로그인의 온보딩 분기 보호', () => {
    render(<AuthedRedirect />);

    act(() => {
      useAuthStore.getState().setAuth('access', 'refresh', member);
    });

    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
