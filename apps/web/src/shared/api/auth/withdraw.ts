// 회원탈퇴 — 서버가 프로필을 탈퇴 처리하고 refresh token을 전부 폐기한다
import { api } from '@/shared/api/client';

export function withdraw(): Promise<null> {
  return api.delete<null>('/api/v1/auth/me');
}
