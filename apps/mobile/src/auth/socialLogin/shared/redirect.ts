// OAuth 콜백 딥링크 판별 — redirect 경로의 단일 출처(providers와 +native-intent가 공유)
export const REDIRECT_PATH = 'oauthredirect';

// 스킴 종류(패키지명·reversed client ID·landit)와 무관하게 경로가 oauthredirect면 콜백으로 본다
export function isOAuthRedirectUrl(url: string): boolean {
  const path = url
    .replace(/^[^:]+:\/*/, '') // 스킴 제거 (슬래시 1개·2개 모두 허용)
    .split(/[?#]/)[0];
  return path === REDIRECT_PATH;
}

// 카카오톡 앱 전환 로그인 복귀 주소(kakao{앱키}://oauth) — 네이티브 SDK가 처리하므로 라우터가 화면으로 열면 안 된다
export function isKakaoTalkLoginUrl(url: string): boolean {
  return /^kakao[0-9a-z]+:\/\/oauth(?:[/?#]|$)/i.test(url);
}
