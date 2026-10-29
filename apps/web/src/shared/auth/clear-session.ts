// 로컬 세션 정리 — 인증 상태·React Query 캐시·언어 쿠키를 반드시 함께 비운다 (남으면 다음 계정에 이전 계정 데이터와 언어가 넘어간다)
import { useAuthStore } from '@/shared/auth/auth-store';
import { clearLocaleCookie } from '@/shared/i18n/locale';
import { getQueryClient } from '@/shared/lib/query-client';

export const clearSession = () => {
  useAuthStore.getState().clearAuth();
  getQueryClient().clear();
  clearLocaleCookie();
};
