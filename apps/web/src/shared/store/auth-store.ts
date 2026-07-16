'use client';

// 인증 상태 관리 — accessToken은 요청마다 노출되는 민감 토큰이라 메모리에서만 관리하고, refreshToken/member만 localStorage에 유지한다
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthMember } from '@/shared/api/auth/social-login';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  member: AuthMember | null;
  setAuth: (
    accessToken: string,
    refreshToken: string,
    member: AuthMember,
  ) => void;
  clearAuth: () => void;
}

// localStorage는 동기라 클라이언트에서 컴포넌트가 마운트된 시점엔 복원이 끝나 있다.
// 라우팅 가드는 SSR 불일치를 피하려고 마운트 이후에만 로그인 여부를 판단한다 ((protected)/layout 참고).
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      member: null,
      setAuth: (accessToken, refreshToken, member) =>
        set({ accessToken, refreshToken, member }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, member: null }),
    }),
    {
      name: 'landit-auth',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        member: state.member,
      }),
    },
  ),
);
