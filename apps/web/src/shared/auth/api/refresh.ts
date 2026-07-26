// refreshToken으로 accessToken을 새로 발급받는다
import { parseApiResponse } from '@/shared/api/parse';
import { useAuthStore } from '@/shared/auth/auth-store';

export const REFRESH_PATH = '/api/v1/auth/token/refresh';

type RefreshTokenResponse = {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

// 진행 중인 refresh 하나를 공유한다 — 동시에 여러 요청이 401을 만나도 refresh는
// 딱 한 번만 나가게 해서, 회전(rotation)되는 refreshToken끼리 꼬여 로그아웃되는 걸 막는다.
let inflight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  inflight ??= doRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doRefresh(): Promise<string | null> {
  const { refreshToken, member, setAuth } = useAuthStore.getState();
  if (!refreshToken || !member) return null;

  try {
    const response = await fetch(REFRESH_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await parseApiResponse<RefreshTokenResponse>(response);

    setAuth(data.accessToken, data.refreshToken, member);
    return data.accessToken;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth] refresh 실패:', error);
    }
    return null;
  }
}
