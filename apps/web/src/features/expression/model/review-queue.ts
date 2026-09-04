// 복습 문제 큐 — 풀 문제의 인덱스를 순서대로 든다. 맨 앞이 지금 문제, 틀리면 맨 뒤로 보내 맞출 때까지 다시 낸다

export type QuizResult = 'correct' | 'wrong';

export const settleReviewQueue = (
  pending: number[],
  result: QuizResult,
): number[] => {
  const [current, ...rest] = pending;
  return result === 'correct' ? rest : [...rest, current];
};
