// 로컬 세션 정리 — 인증 상태와 React Query 캐시를 반드시 함께 비운다 (캐시만 남으면 다음 계정에 이전 계정 데이터가 노출된다)
import { getQueryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/store/auth-store';

export const clearSession = () => {
  useAuthStore.getState().clearAuth();
  getQueryClient().clear();
};
