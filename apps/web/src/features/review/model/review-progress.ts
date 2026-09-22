// 서버가 준 복습 상태에서 화면이 쓸 값을 뽑는다 — 큐 순서·채점은 서버가 정하고, 여기선 읽기만 한다.
// 다만 "언제 끝내는가"는 FE 규칙이다 — 서버는 전부 맞혀야 완료로 보지만, 우리는 문제마다 두 번까지만 낸다
import type { Review, ReviewQuestion } from '../api/review';

// 한 문제에 주는 기회 — 처음 한 번과 큐 뒤에서 다시 만났을 때 한 번
export const MAX_ATTEMPTS = 2;

export const isSolved = (question: ReviewQuestion) =>
  question.completedAt !== null;

// 두 번 다 틀린 문제 — 더 내지 않고 결과 화면에서 놓친 표현으로 보여준다
export const isFailed = (question: ReviewQuestion) =>
  !isSolved(question) && question.wrongCount >= MAX_ATTEMPTS;

// 아직 기회가 남은 문제들
export const pendingQuestionsOf = (review: Review) =>
  review.questions.filter(
    (question) => !isSolved(question) && !isFailed(question),
  );

export const currentQuestionOf = (review: Review): ReviewQuestion | null =>
  review.questions.find(
    (question) => question.questionId === review.currentQuestionId,
  ) ?? null;

/**
 * 더 낼 문제가 없는가. 서버가 완료로 바꾸는 건 전부 맞혔을 때뿐이라,
 * 두 번씩 풀어 실패로 끝난 복습은 여기서 끝난 것으로 본다.
 */
export const isFinished = (review: Review) =>
  review.status === 'COMPLETED' ||
  (review.questions.length > 0 && pendingQuestionsOf(review).length === 0);

// 진행바는 결판난 문제 수(맞힘·놓침)만큼 찬다 — 같은 문제를 다시 풀 땐 제자리다
export const progressRangeOf = (review: Review): [number, number] => {
  const total = review.questions.length;
  if (total === 0) return [0, 1];

  const resolved = total - pendingQuestionsOf(review).length;
  return [resolved / total, (resolved + 1) / total];
};
