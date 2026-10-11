// 인증 상태 — 지금 로그인한 회원 id를 읽는다
import { afterEach, describe, expect, it } from 'vitest';

import type { AuthMember } from './api/social-login';
import { getCurrentUserId, useAuthStore } from './auth-store';

afterEach(() => useAuthStore.getState().clearAuth());

describe('getCurrentUserId', () => {
  it('로그인해 있으면 회원 id를 돌려준다', () => {
    const member = { userId: 7 } as AuthMember;
    useAuthStore.getState().setAuth('access', 'refresh', member);

    expect(getCurrentUserId()).toBe(7);
  });

  it('로그아웃 상태면 null이다', () => {
    expect(getCurrentUserId()).toBeNull();
  });
});
