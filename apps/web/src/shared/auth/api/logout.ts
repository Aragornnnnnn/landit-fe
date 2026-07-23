// 서버에 refreshToken 폐기(로그아웃)를 요청한다
import { api } from '@/shared/api/client';

export function logout(refreshToken: string): Promise<null> {
  return api.post<null>('/api/v1/auth/logout', { refreshToken });
}
