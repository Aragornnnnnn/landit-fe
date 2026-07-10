// provider별 네이티브 소셜 로그인으로 OIDC id_token을 받아온다 — 웹이 이걸로 /social-login을 호출한다
import { requestAppleLogin } from './providers/apple';
import { requestGoogleIdToken } from './providers/google';
import { requestKakaoIdToken } from './providers/kakao';

export { SocialLoginError } from './shared/errors';

export type SocialProvider = 'kakao' | 'google' | 'apple';

export interface SocialLoginResult {
  idToken: string;
  // 애플 최초 로그인에서만 존재 — 구글·카카오는 이름이 id_token 클레임에 들어 있어 따로 안 보낸다
  nickname?: string;
}

export async function requestSocialIdToken(
  provider: SocialProvider,
  nonce: string,
): Promise<SocialLoginResult> {
  switch (provider) {
    case 'google':
      return { idToken: await requestGoogleIdToken(nonce) };
    case 'kakao':
      return { idToken: await requestKakaoIdToken(nonce) };
    case 'apple':
      return requestAppleLogin(nonce);
  }
}
