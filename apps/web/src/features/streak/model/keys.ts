// 스트릭 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 포함해 계정이 바뀌면 다른 캐시를 보게 한다 — scenarioKeys와 같은 이중 방어
export const streakKeys = {
  all: ['streak'] as const,
  current: (userId: number | null) =>
    [...streakKeys.all, userId, 'current'] as const,
  calendar: (userId: number | null, year: number, month: number) =>
    [...streakKeys.all, userId, 'calendar', year, month] as const,
};
