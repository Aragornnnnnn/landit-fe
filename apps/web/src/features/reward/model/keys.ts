// 환급 도메인의 React Query 키 — userId를 키에 넣어 계정이 바뀌면 다른 캐시를 보게 한다
export const rewardKeys = {
  all: ['reward'] as const,
  // 내역 키가 같은 사용자 아래에 따로 붙을 수 있게 끝에 이름을 둔다
  summary: (userId: number | null) =>
    [...rewardKeys.all, userId, 'summary'] as const,
  history: (userId: number | null) =>
    [...rewardKeys.all, userId, 'history'] as const,
  // 조회 결과가 아니라 완료 직전에 적어 두는 값 — 계정 스코프와 로그아웃 정리를 물려받으려고 캐시에 둔다
  earnBase: (userId: number | null) =>
    [...rewardKeys.all, userId, 'earnBase'] as const,
};
