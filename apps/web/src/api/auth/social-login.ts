// 소셜 로그인 idToken을 백엔드에 넘겨 자체 access/refresh 토큰을 발급받는다
import { parseApiResponse } from '@/api/parse';

export const SOCIAL_LOGIN_PATH = '/api/v1/auth/social-login';

// 백엔드 AuthTokenResponse 원형. newUser는 로그인 시점 전용(온보딩 분기용)이라 저장하지 않는다.
interface SocialLoginResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: {
    userId: number;
    nickname: string | null;
    email: string | null;
    provider: string;
    newUser: boolean;
  };
}

// 전역 상태(member)에 저장하는 모양 — 응답 user에서 로그인 시점 전용 newUser만 뺀 파생 타입
export type AuthMember = Omit<SocialLoginResponse['user'], 'newUser'>;

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
