// 친구 초대의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다. userId를 넣어 계정이 바뀌면 다른 캐시를 본다
export const referralKeys = {
  all: ['referral'] as const,
  summary: (userId: number | null) =>
    [...referralKeys.all, userId, 'summary'] as const,
  preview: (userId: number | null, code: string) =>
    [...referralKeys.all, userId, 'preview', code] as const,
};
