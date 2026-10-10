// 알람 설정 React Query 키 — 계정이 바뀌면 다른 캐시를 보게 userId를 넣는다
export const alarmKeys = {
  all: ['alarm'] as const,
  mine: (userId: number | null) => [...alarmKeys.all, userId] as const,
};
