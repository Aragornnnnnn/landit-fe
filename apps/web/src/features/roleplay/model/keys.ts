// 롤플레이 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 넣어 계정이 바뀌면 다른 캐시를 보게 한다
export const roleplayKeys = {
  all: ['roleplay'] as const,
  // 내 시나리오 목록 — 만들거나 지우면 다시 받는다
  scenarios: (userId: number | null) =>
    [...roleplayKeys.all, userId, 'scenarios'] as const,
  // 시나리오 하나로 한 지난 대화
  sessions: (userId: number | null, scenarioId: number) =>
    [...roleplayKeys.all, userId, 'sessions', scenarioId] as const,
};
