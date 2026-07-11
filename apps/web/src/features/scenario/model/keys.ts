// 시나리오 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
export const scenarioKeys = {
  all: ['scenarios'] as const,
  list: () => [...scenarioKeys.all, 'list'] as const,
};
