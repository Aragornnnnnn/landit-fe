// 롤플레이 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 넣어 계정이 바뀌면 다른 캐시를 보게 한다
export const roleplayKeys = {
  all: ['roleplay'] as const,
  // 내 시나리오 목록 — 만들면 다시 받는다
  scenarios: (userId: number | null) =>
    [...roleplayKeys.all, userId, 'scenarios'] as const,
  // 끝난 대화 한 건의 요약(오늘의 롤플레이) — 대화가 끝나는 자리에서 미리 받아 둔다
  summary: (userId: number | null, sessionId: number) =>
    [...roleplayKeys.all, userId, 'summary', sessionId] as const,
};
