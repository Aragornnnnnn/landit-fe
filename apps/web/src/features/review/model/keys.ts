// 푸시 복습 React Query 키 — 복습 하나만 조회하므로 상세 키 하나로 끝난다
export const reviewKeys = {
  all: ['reviews'] as const,
  detail: (reviewId: string) => [...reviewKeys.all, reviewId] as const,
};
