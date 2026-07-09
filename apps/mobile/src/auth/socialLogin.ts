// provider별 네이티브 소셜 로그인으로 OIDC id_token을 받아온다 — 웹이 이걸로 /social-login을 호출한다
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// 브라우저가 닫힌 뒤 남은 리다이렉트 결과를 마무리한다 (auth-session 권장 초기화)
WebBrowser.maybeCompleteAuthSession();

const REDIRECT_PATH = 'oauthredirect';

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const KAKAO_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
  tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

const GOOGLE_SCOPES = ['openid', 'email', 'profile'];
// openid는 id_token 발급 필수. account_email은 카카오 콘솔에서 이메일 권한이 승인돼야 클레임에 실린다.
const KAKAO_SCOPES = ['openid', 'profile_nickname'];

export type SocialProvider = 'kakao' | 'google' | 'apple';

export class SocialLoginError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

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

// Apple — OS가 시트를 띄우고 id_token을 발급한다. 요청한 nonce가 그대로 id_token 클레임에 들어간다.
// fullName은 최초 1회만 주지만 landit-be에 받을 필드가 없어 사용하지 않는다.
async function requestAppleIdToken(nonce: string): Promise<string> {
  if (Platform.OS !== 'ios') {
    throw new SocialLoginError(
      'APPLE_UNSUPPORTED',
      'Apple 로그인은 iOS에서만 지원돼요.',
    );
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });
    return assertIdToken(
      credential.identityToken ?? undefined,
      'APPLE_ID_TOKEN_MISSING',
    );
  } catch (error) {
    if (isCanceled(error)) {
      throw new SocialLoginError('APPLE_CANCELLED', '로그인이 취소됐어요.');
    }
    throw error;
  }
}

async function requestGoogleIdToken(nonce: string): Promise<string> {
  const clientId = getGoogleClientId();
  return requestOidcIdToken({
    clientId,
    redirectUri: getGoogleRedirectUri(clientId),
    discovery: GOOGLE_DISCOVERY,
    scopes: GOOGLE_SCOPES,
    nonce,
    cancelCode: 'GOOGLE_CANCELLED',
    missingCode: 'GOOGLE_ID_TOKEN_MISSING',
    extraAuthParams: { prompt: 'select_account' },
  });
}

async function requestKakaoIdToken(nonce: string): Promise<string> {
  const clientId = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim();
  if (!clientId) {
    throw new SocialLoginError(
      'KAKAO_REST_API_KEY_MISSING',
      'Kakao REST API 키가 설정되지 않았어요.',
    );
  }
  return requestOidcIdToken({
    clientId,
    redirectUri: getRedirectUri(),
    discovery: KAKAO_DISCOVERY,
    scopes: KAKAO_SCOPES,
    nonce,
    cancelCode: 'KAKAO_CANCELLED',
    missingCode: 'KAKAO_ID_TOKEN_MISSING',
  });
}

// 구글·카카오 공통 — OIDC Authorization Code + PKCE 흐름으로 id_token을 받는다.
// nonce는 authorize 요청 파라미터로 넣으면 provider가 id_token의 nonce 클레임에 실어 돌려준다.
async function requestOidcIdToken(params: {
  clientId: string;
  redirectUri: string;
  discovery: AuthSession.DiscoveryDocument;
  scopes: string[];
  nonce: string;
  cancelCode: string;
  missingCode: string;
  extraAuthParams?: Record<string, string>;
}): Promise<string> {
  const request = new AuthSession.AuthRequest({
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: params.scopes,
    extraParams: { nonce: params.nonce, ...params.extraAuthParams },
  });

  const result = await request.promptAsync(params.discovery);
  const code = assertAuthCode(result, params.cancelCode);

  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId: params.clientId,
      code,
      redirectUri: params.redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    params.discovery,
  );

  return assertIdToken(token.idToken, params.missingCode);
}

function getRedirectUri(): string {
  const configured = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URI?.trim();
  if (configured) return configured;
  return AuthSession.makeRedirectUri({ scheme: 'landit', path: REDIRECT_PATH });
}

// iOS 구글은 reversed client ID 스킴만 redirect로 허용한다(커스텀 스킴/웹 URL 불가).
// "xxx.apps.googleusercontent.com" → "com.googleusercontent.apps.xxx:/oauthredirect"
// (슬래시 1개 — 구글은 커스텀 스킴에 authority(슬래시 2개)를 허용하지 않는다). Android는 landit 스킴을 쓴다.
function getGoogleRedirectUri(clientId: string): string {
  if (Platform.OS === 'ios') {
    const reversed = `com.googleusercontent.apps.${clientId.replace(/\.apps\.googleusercontent\.com$/, '')}`;
    return AuthSession.makeRedirectUri({
      native: `${reversed}:/${REDIRECT_PATH}`,
    });
  }
  return getRedirectUri();
}

function getGoogleClientId(): string {
  const platformClientId = Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  const clientId =
    platformClientId?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!clientId) {
    throw new SocialLoginError(
      'GOOGLE_CLIENT_ID_MISSING',
      'Google OAuth client ID가 설정되지 않았어요.',
    );
  }
  return clientId;
}

function assertAuthCode(
  result: AuthSession.AuthSessionResult,
  cancelCode: string,
): string {
  if (result.type !== 'success') {
    throw new SocialLoginError(cancelCode, '로그인이 취소됐어요.');
  }
  if (result.params.error) {
    throw new SocialLoginError(
      String(result.params.error),
      String(result.params.error_description ?? result.params.error),
    );
  }
  const code = result.params.code;
  if (!code) {
    throw new SocialLoginError(
      'AUTH_CODE_MISSING',
      '인증 코드를 받지 못했어요.',
    );
  }
  return code;
}

function assertIdToken(idToken: string | undefined, code: string): string {
  if (!idToken) {
    throw new SocialLoginError(code, 'id_token을 받지 못했어요.');
  }
  return idToken;
}

function isCanceled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
  );
}
