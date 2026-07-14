// 표현 도메인 React Query 키 팩토리 — 무효화 범위를 여기서만 만든다
// 리스트는 완료·잠금이 사용자별 상태라 userId를 키에 포함한다 (계정 전환 시 캐시 분리)
export const expressionKeys = {
  all: ['expressions'] as const,
  list: (userId: number | null, scenarioId: number) =>
    [...expressionKeys.all, 'list', userId, scenarioId] as const,
  practice: (expressionId: number) =>
    [...expressionKeys.all, 'practice', expressionId] as const,
};
