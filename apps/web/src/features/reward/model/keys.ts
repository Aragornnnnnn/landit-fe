// 환급 도메인의 React Query 키 — userId를 키에 넣어 계정이 바뀌면 다른 캐시를 보게 한다
export const rewardKeys = {
  all: ['reward'] as const,
  // 내역 키가 같은 사용자 아래에 따로 붙을 수 있게 끝에 이름을 둔다
  summary: (userId: number | null) =>
    [...rewardKeys.all, userId, 'summary'] as const,
  history: (userId: number | null) =>
    [...rewardKeys.all, userId, 'history'] as const,
  // 무료로 한 날의 기록 — 결제한 사람의 내역과 따로 받는다
  previewHistory: (userId: number | null) =>
    [...rewardKeys.all, userId, 'previewHistory'] as const,
  // 조회 결과가 아니라 완료 순간에 적어 두는 받은 금액 — 계정 스코프와 로그아웃 정리를 물려받으려고 캐시에 둔다
  completionEarn: (userId: number | null) =>
    [...rewardKeys.all, userId, 'completionEarn'] as const,
};

// 환급 캐시를 보는 화면이 없어도 붙들어 두는 시간 — 대화가 길어도, 완료 뒤 다른 화면에 머물러도 받아 둔 것이 남아야 한다
export const REWARD_GC_MS = 30 * 60 * 1000;
