// 구글 로그인 — OIDC Authorization Code + PKCE 흐름으로 id_token을 받는다
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

import { assertIdToken, SocialLoginError } from '../shared/errors';

// 브라우저가 닫힌 뒤 남은 리다이렉트 결과를 마무리한다 (auth-session 권장 초기화)
WebBrowser.maybeCompleteAuthSession();

const REDIRECT_PATH = 'oauthredirect';

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

// nonce는 authorize 요청 파라미터로 넣으면 구글이 id_token의 nonce 클레임에 실어 돌려준다.
export async function requestGoogleIdToken(nonce: string): Promise<string> {
  const clientId = getGoogleClientId();
  const redirectUri = getGoogleRedirectUri(clientId);

  const authRequest = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: GOOGLE_SCOPES,
    extraParams: { nonce, prompt: 'select_account' },
  });

  const result = await authRequest.promptAsync(GOOGLE_DISCOVERY);
  const code = assertAuthCode(result);

  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: { code_verifier: authRequest.codeVerifier ?? '' },
    },
    GOOGLE_DISCOVERY,
  );

  return assertIdToken(token.idToken);
}

function assertAuthCode(result: AuthSession.AuthSessionResult): string {
  if (result.type !== 'success') {
    throw new SocialLoginError('로그인이 취소됐어요.', true);
  }
  if (result.params.error) {
    throw new SocialLoginError(
      String(result.params.error_description ?? result.params.error),
    );
  }
  const code = result.params.code;
  if (!code) {
    throw new SocialLoginError('인증 코드를 받지 못했어요.');
  }
  return code;
}

// 구글이 강제하는 플랫폼별 스킴을 만든다 — iOS는 reversed client ID, Android는 앱 패키지명 (슬래시 1개)
function getGoogleRedirectUri(clientId: string): string {
  const scheme = Platform.select({
    // 'xxx.apps.googleusercontent.com' → 'com.googleusercontent.apps.xxx'
    ios: clientId.split('.').reverse().join('.'),
    android: Constants.expoConfig?.android?.package,
  });
  return AuthSession.makeRedirectUri({ native: `${scheme}:/${REDIRECT_PATH}` });
}

function getGoogleClientId(): string {
  const clientId = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim(),
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim(),
  });
  if (!clientId) {
    throw new SocialLoginError('Google OAuth client ID가 설정되지 않았어요.');
  }
  return clientId;
}
