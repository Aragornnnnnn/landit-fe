'use client';

// 인증 상태 관리 — accessToken은 요청마다 노출되는 민감 토큰이라 메모리에서만 관리하고, refreshToken/member만 localStorage에 유지한다
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 로그인 응답에서 저장할 사용자 신원 정보
export interface AuthMember {
  userId: number;
  nickname: string | null;
  email: string | null;
  provider: string;
}

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

// TODO: "로그인 안 됐으면 /login으로" 라우팅 가드를 만들 때, persist 하이드레이션이 끝나기
// 전엔 refreshToken이 실제로는 있는데 없는 것처럼 보이는 순간이 있다. 그때 _hasHydrated
// 플래그 + onRehydrateStorage 콜백을 다시 추가할 것 (지금은 쓰는 곳이 없어서 뺐음).
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
