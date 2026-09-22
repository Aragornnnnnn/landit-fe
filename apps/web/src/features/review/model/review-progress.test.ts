// 서버 복습 상태에서 지금 낼 문제·진행 구간·끝낼 시점을 뽑는 규칙
import { describe, expect, it } from 'vitest';

import type { Review, ReviewQuestion } from '../api/review';
import {
  currentQuestionOf,
  isFinished,
  pendingQuestionsOf,
  progressRangeOf,
} from './review-progress';

const question = (
  questionId: string,
  completedAt: string | null = null,
  wrongCount = 0,
): ReviewQuestion =>
  ({
    questionId,
    expressionId: 1,
    targetExpressionText: 'blow my mind',
    baseExpressionMeaningText: '끝내준다',
    quiz: {},
    displayOrder: 0,
    queueOrder: 0,
    wrongCount,
    completedAt,
  }) as unknown as ReviewQuestion;

const review = (
  currentQuestionId: string | null,
  questions: ReviewQuestion[],
  status: Review['status'] = 'IN_PROGRESS',
): Review =>
  ({
    reviewId: 'r1',
    status,
    currentQuestionId,
    questions,
  }) as unknown as Review;

describe('복습 진행 상태', () => {
  it('서버가 가리킨 현재 문제를 찾아 준다', () => {
    const state = review('q2', [
      question('q1', '2026-09-22T10:00'),
      question('q2'),
    ]);

    expect(currentQuestionOf(state)?.questionId).toBe('q2');
  });

  it('현재 문제가 없으면(시작 전·완료) null을 준다', () => {
    const state = review(null, [question('q1', '2026-09-22T10:00')]);

    expect(currentQuestionOf(state)).toBeNull();
  });

  it('두 번 틀린 문제는 더 내지 않는다', () => {
    const state = review('q1', [question('q1', null, 2), question('q2')]);

    expect(pendingQuestionsOf(state).map((it) => it.questionId)).toEqual([
      'q2',
    ]);
  });

  it('한 번만 틀린 문제는 다시 낸다', () => {
    const state = review('q1', [question('q1', null, 1)]);

    expect(pendingQuestionsOf(state)).toHaveLength(1);
  });

  it('맞힌 문제와 두 번 틀린 문제만 남으면 복습이 끝난 것으로 본다', () => {
    const state = review('q2', [
      question('q1', '2026-09-22T10:00'),
      question('q2', null, 2),
    ]);

    expect(isFinished(state)).toBe(true);
  });

  it('아직 기회가 남은 문제가 있으면 끝나지 않았다', () => {
    const state = review('q2', [
      question('q1', '2026-09-22T10:00'),
      question('q2', null, 1),
    ]);

    expect(isFinished(state)).toBe(false);
  });

  it('서버가 완료로 바꿨으면 그대로 끝난 것으로 본다', () => {
    expect(isFinished(review(null, [], 'COMPLETED'))).toBe(true);
  });

  it('결판난 문제 수만큼 진행 구간이 앞으로 간다 — 놓친 문제도 센다', () => {
    const state = review('q3', [
      question('q1', '2026-09-22T10:00'),
      question('q2', null, 2),
      question('q3'),
    ]);

    expect(progressRangeOf(state)).toEqual([2 / 3, 1]);
  });

  it('문제가 없으면 진행 구간을 0에서 끝까지로 둔다', () => {
    expect(progressRangeOf(review(null, []))).toEqual([0, 1]);
  });
});
