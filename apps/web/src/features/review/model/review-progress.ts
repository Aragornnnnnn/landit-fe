// 서버가 준 복습 상태에서 화면이 쓸 값을 뽑는다 — 채점·큐 순서·종료 판정은 모두 서버가 하고 여기선 읽기만 한다.
// 문제는 정답 또는 두 번째 오답에서 끝난다. 그래서 completedAt은 "끝난 시각"이지 "맞힌 시각"이 아니다
import type { Review, ReviewQuestion } from '../api/review';

// 서버가 문제를 끝내는 오답 횟수 — 두 번째 오답이면 그 문제는 놓친 채로 끝난다
export const MAX_ATTEMPTS = 2;

// 끝난 문제인가 — 맞혔든 두 번 틀렸든 서버가 종료 시각을 찍는다
export const isResolved = (question: ReviewQuestion) =>
  question.completedAt !== null;

/**
 * 맞혀서 끝났는가. 끝난 문제 중 오답이 상한에 못 미친 것만 맞힘으로 본다.
 *
 * 한계 — 과거 정책(두 번 이상 틀린 뒤에도 정답을 낼 수 있던 때)으로 쌓인 기록은
 * `completedAt`과 `wrongCount`만으로 새 정책의 놓침과 구분할 수 없어 놓침으로 보인다.
 * 정확히 가르려면 BE에 문제별 정답 여부 필드가 필요하다 (지금 계약에는 없다).
 */
export const isSolved = (question: ReviewQuestion) =>
  isResolved(question) && question.wrongCount < MAX_ATTEMPTS;

// 두 번 틀려 놓친 채 끝난 문제
export const isFailed = (question: ReviewQuestion) =>
  isResolved(question) && question.wrongCount >= MAX_ATTEMPTS;

// 아직 끝나지 않은 문제들 — 서버가 이 중에서 현재 문제를 고른다
export const pendingQuestionsOf = (review: Review) =>
  review.questions.filter((question) => !isResolved(question));

export const currentQuestionOf = (review: Review): ReviewQuestion | null =>
  review.questions.find(
    (question) => question.questionId === review.currentQuestionId,
  ) ?? null;

// 복습 전체가 끝났는가 — 서버가 모든 문제의 종료를 보고 status를 바꾼다(맞힌 개수와 무관하다)
export const isFinished = (review: Review) => review.status === 'COMPLETED';

// 진행바는 끝난 문제 수만큼 찬다 — 맞히든 놓치든 한 칸이고, 첫 오답으로 다시 낼 문제는 제자리다
export const progressRangeOf = (review: Review): [number, number] => {
  const total = review.questions.length;
  if (total === 0) return [0, 1];

  const resolved = review.questions.filter(isResolved).length;
  return [resolved / total, Math.min(resolved + 1, total) / total];
};
