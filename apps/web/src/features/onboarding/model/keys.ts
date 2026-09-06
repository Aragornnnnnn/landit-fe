// 프로필 답변(학습 수준·배울 영어)의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다.
// userId를 키에 포함해 계정이 바뀌면 다른 캐시를 보게 한다 (streakKeys와 같은 이중 방어)
export const profileKeys = {
  all: ['profile'] as const,
  learningLevel: (userId: number | null) =>
    [...profileKeys.all, userId, 'learning-level'] as const,
  accent: (userId: number | null) =>
    [...profileKeys.all, userId, 'accent-locale'] as const,
};
