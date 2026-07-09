// 소셜 로그인 idToken을 백엔드에 넘겨 자체 access/refresh 토큰을 발급받는다
import { parseApiResponse } from '@/api/parse';
import type { AuthMember } from '@/store/auth-store';

export const SOCIAL_LOGIN_PATH = '/api/v1/auth/social-login';

// 백엔드 AuthTokenResponse. user는 저장용 AuthMember + 로그인 시점 전용 newUser.
interface SocialLoginResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: AuthMember & { newUser: boolean };
}

export async function socialLogin(
  provider: string,
  idToken: string,
  nonce: string,
): Promise<SocialLoginResponse> {
  const response = await fetch(SOCIAL_LOGIN_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, idToken, nonce }),
  });
  return parseApiResponse<SocialLoginResponse>(response);
}
