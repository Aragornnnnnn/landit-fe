// 위젯 탭 딥링크 판별 — 위젯은 셸을 여는 것까지만 하고 화면은 웹(WebView)이 담당한다
export const WIDGET_ENTRY_URL = 'landit://widget';

export function isWidgetEntryUrl(url: string): boolean {
  const path = url
    .replace(/^[^:]+:\/*/, '') // 스킴 제거 (슬래시 1개·2개 모두 허용)
    .split(/[?#]/)[0];
  return path === 'widget';
}
