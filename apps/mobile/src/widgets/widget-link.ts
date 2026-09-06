// 위젯 탭 딥링크 판별과 웹 진입 경로 — 위젯은 셸을 여는 것까지만 하고 화면은 웹(WebView)이 담당한다
export const WIDGET_ENTRY_URL = 'landit://widget';

// 위젯으로 들어온 사람이 처음 보는 웹 경로 — 유입 딱지(UTM)는 docs/analytics-utm.md의 위젯 자리 그대로.
// 웹은 이 딱지로 위젯 유입을 세고(페이지뷰 파생·어트리뷰션) 주소에서 지운다
export const WIDGET_ENTRY_PATH =
  '/scenario?utm_source=widget&utm_medium=widget&utm_campaign=streak_widget';

export function isWidgetEntryUrl(url: string): boolean {
  const path = url
    .replace(/^[^:]+:\/*/, '') // 스킴 제거 (슬래시 1개·2개 모두 허용)
    .split(/[?#]/)[0];
  return path === 'widget';
}

// 앱을 연 딥링크가 위젯 탭이면 웹 진입 경로를, 아니면(알림·OAuth·없음) null을 돌려준다
export const widgetEntryPath = (
  url: string | null | undefined,
): string | null => (url && isWidgetEntryUrl(url) ? WIDGET_ENTRY_PATH : null);
