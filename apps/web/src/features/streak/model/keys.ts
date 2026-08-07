// 스트릭 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 포함해 계정이 바뀌면 다른 캐시를 보게 한다 — scenarioKeys와 같은 이중 방어
import type { YearMonth } from '../lib/seoul-date';

export const streakKeys = {
  all: ['streak'] as const,
  current: (userId: number | null) =>
    [...streakKeys.all, userId, 'current'] as const,
  // 달을 안 정한 조회는 'current'로 따로 잡는다 — 응답이 와야 어느 달인지 알기 때문이다.
  // 받고 나면 그 달의 키에도 심어 둬서 되돌아올 때 다시 부르지 않는다 (useStreakCalendar 참고)
  calendar: (userId: number | null, view: YearMonth | null) =>
    [...streakKeys.all, userId, 'calendar', view ?? 'current'] as const,
  // 조회 결과가 아니라 완료 순간에 심어 두는 값 — 대화에 들어갈 때 알던 스트릭.
  // 캐시에 두는 건 계정 스코프와 로그아웃 정리를 그대로 물려받기 위해서다 (celebration 참고)
  celebrationBase: (userId: number | null) =>
    [...streakKeys.all, userId, 'celebration-base'] as const,
};
