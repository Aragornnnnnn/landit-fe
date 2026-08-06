// 셸 밖 이동 판별 — 웹 도메인 밖으로 나가는 주소는 WebView에 두지 않고 OS(브라우저)가 연다
//
// market: 같은 http(s) 밖 스킴은 여기까지 오지 않는다 — react-native-webview가 originWhitelist
// (기본 http/https)에서 걸러 스스로 Linking.openURL로 넘긴다. 예외가 about:blank로, 화이트리스트를
// 통과해 여기로 오는데 WebView가 로드 과정에서 거치는 주소라 밖으로 넘기면 안 된다
export const isExternalNavigation = (
  url: string,
  webUrl: string | null,
): boolean => {
  if (!webUrl) return false;
  if (url.startsWith('about:')) return false;

  try {
    return new URL(url).origin !== new URL(webUrl).origin;
  } catch {
    return false;
  }
};
