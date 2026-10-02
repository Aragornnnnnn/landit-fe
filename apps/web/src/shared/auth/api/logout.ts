// 서버에 refreshToken 폐기(로그아웃)를 요청한다
import { api } from '@/shared/api/client';

// installationId가 있으면 이 계정이 아직 그 앱 설치를 가진 경우 설치 푸시도 끊는다. 브라우저는 null
export function logout(
  refreshToken: string,
  installationId: string | null,
): Promise<null> {
  return api.post<null>('/api/v1/auth/logout', {
    refreshToken,
    installationId,
  });
}
