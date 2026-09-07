// 구독 도메인의 React Query 키 — userId를 키에 넣어 계정이 바뀌면 다른 캐시를 보게 한다
export const subscriptionKeys = {
  all: ['subscription'] as const,
  mine: (userId: number | null) => [...subscriptionKeys.all, userId] as const,
};
