// 스몰톡 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 포함해 계정이 바뀌면 다른 캐시를 보게 한다 — 세션 종료 시 clearSession()과 함께 가는 이중 방어
export const smallTalkKeys = {
  all: ['small-talk'] as const,
  // 고를 주제 + 오늘 남은 말하기 예산. 대화를 마치면 예산이 줄어 다시 받아야 한다
  main: (userId: number | null) =>
    [...smallTalkKeys.all, userId, 'main'] as const,
};
