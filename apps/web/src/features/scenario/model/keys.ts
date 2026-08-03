// 시나리오 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 포함해 계정이 바뀌면 다른 캐시를 보게 한다 — 세션 종료 시 clearSession()과 함께 가는 이중 방어
export const scenarioKeys = {
  all: ['scenarios'] as const,
  list: (userId: number | null) =>
    [...scenarioKeys.all, userId, 'list'] as const,
  // 날짜별 시나리오 — 날짜를 키에 넣어 달력에서 날짜를 옮길 때마다 각자 캐시된다.
  // 날짜 생략(오늘)은 'today'로 구분한다
  daily: (userId: number | null, date: string | null) =>
    [...scenarioKeys.all, userId, 'daily', date ?? 'today'] as const,
};
