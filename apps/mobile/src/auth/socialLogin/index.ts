// provider별 네이티브 소셜 로그인으로 OIDC id_token을 받아온다 — 웹이 이걸로 /social-login을 호출한다
import { requestAppleIdToken } from './providers/apple';
import { requestGoogleIdToken } from './providers/google';
import { requestKakaoIdToken } from './providers/kakao';

export { SocialLoginError } from './shared/errors';

export type SocialProvider = 'kakao' | 'google' | 'apple';

export async function requestSocialIdToken(
  provider: SocialProvider,
  nonce: string,
): Promise<string> {
  switch (provider) {
    case 'google':
      return requestGoogleIdToken(nonce);
    case 'kakao':
      return requestKakaoIdToken(nonce);
    case 'apple':
      return requestAppleIdToken(nonce);
  }
}
