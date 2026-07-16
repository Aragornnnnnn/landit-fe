// 브라우저 단독 소셜 로그인 진입 — 네이티브 브릿지가 없을 때의 웹 폴백(카카오 JS SDK, 구글 PKCE redirect)
import {
  createCodeChallenge,
  generateCodeVerifier,
  generateRandomHex,
} from '@/shared/lib/crypto';

// 애플은 실도메인이 필요해 웹 폴백에서 제외한다 — 웹은 카카오·구글만
export type WebSocialProvider = 'kakao' | 'google';

// 콜백에서 복원할 진행 중 로그인 정보. code→id_token 교환과 state(CSRF)·nonce 대조에 쓴다
export interface PendingSocialLogin {
  provider: WebSocialProvider;
  nonce: string;
  state: string;
  redirectUri: string;
  codeVerifier?: string; // 구글 PKCE 전용
}

const SOCIAL_LOGIN_STORAGE_KEY = 'landit-social-login';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';

// 설정된 redirect URI가 없으면 현재 origin 기준 콜백 경로를 쓴다 — 기본이 곧 localhost 개발 경로가 되게
export function resolveRedirectUri(
  configured: string | undefined,
  origin: string,
  provider: WebSocialProvider,
): string {
  return configured || `${origin}/auth/${provider}/callback`;
}

export function buildGoogleAuthUrl(input: {
  clientId: string;
  redirectUri: string;
  nonce: string;
  state: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    scope: 'openid email profile',
    nonce: input.nonce,
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function readPendingSocialLogin(): PendingSocialLogin | null {
  const raw = sessionStorage.getItem(SOCIAL_LOGIN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSocialLogin;
  } catch {
    return null;
  }
}

export function clearPendingSocialLogin(): void {
  sessionStorage.removeItem(SOCIAL_LOGIN_STORAGE_KEY);
}

// 로그인 시작 — pending을 저장하고 제공자 인증 페이지로 이동시킨다(성공 시 현재 페이지를 떠남)
export async function startWebSocialLogin(
  provider: WebSocialProvider,
  nonce: string,
): Promise<void> {
  const state = generateRandomHex(16);
  const configured =
    provider === 'google'
      ? process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
      : process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  const redirectUri = resolveRedirectUri(
    configured,
    window.location.origin,
    provider,
  );
  const codeVerifier =
    provider === 'google' ? generateCodeVerifier() : undefined;

  const pending: PendingSocialLogin = {
    provider,
    nonce,
    state,
    redirectUri,
    codeVerifier,
  };
  sessionStorage.setItem(SOCIAL_LOGIN_STORAGE_KEY, JSON.stringify(pending));

  if (provider === 'kakao') {
    await startKakaoAuthorize(pending);
    return;
  }

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId)
    throw new Error(
      'Google OAuth client ID(NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID)가 설정되지 않았어요.',
    );
  const codeChallenge = await createCodeChallenge(codeVerifier as string);
  window.location.assign(
    buildGoogleAuthUrl({ clientId, redirectUri, nonce, state, codeChallenge }),
  );
}

// 카카오는 REST authorize URL 대신 JS SDK를 CDN에서 불러와 authorize를 호출한다(openid scope로 id_token 발급)
interface KakaoSdk {
  isInitialized: () => boolean;
  init: (jsKey: string) => void;
  Auth: {
    authorize: (options: {
      redirectUri: string;
      state: string;
      nonce: string;
      scope: string;
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

async function startKakaoAuthorize(pending: PendingSocialLogin): Promise<void> {
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey)
    throw new Error(
      'Kakao JS 키(NEXT_PUBLIC_KAKAO_JS_KEY)가 설정되지 않았어요.',
    );

  const Kakao = await loadKakaoSdk();
  if (!Kakao.isInitialized()) Kakao.init(jsKey);
  Kakao.Auth.authorize({
    redirectUri: pending.redirectUri,
    state: pending.state,
    nonce: pending.nonce,
    scope: 'openid,profile_nickname',
  });
}

function loadKakaoSdk(): Promise<KakaoSdk> {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.Kakao) resolve(window.Kakao);
      else reject(new Error('Kakao SDK 로드에 실패했어요.'));
    };
    script.onerror = () => reject(new Error('Kakao SDK 로드에 실패했어요.'));
    document.head.appendChild(script);
  });
}
