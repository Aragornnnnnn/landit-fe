// OAuth 콜백 딥링크 판별 — redirect 경로의 단일 출처(providers와 +native-intent가 공유)
export const REDIRECT_PATH = 'oauthredirect';

// 스킴 종류(패키지명·reversed client ID·landit)와 무관하게 경로가 oauthredirect면 콜백으로 본다
export function isOAuthRedirectUrl(url: string): boolean {
  const path = url
    .replace(/^[^:]+:\/*/, '') // 스킴 제거 (슬래시 1개·2개 모두 허용)
    .split(/[?#]/)[0];
  return path === REDIRECT_PATH;
}
