// 서버 복습 상태에서 지금 낼 문제·진행 구간·끝난 문제 판정을 뽑는 규칙
import { describe, expect, it } from 'vitest';

import type { Review, ReviewQuestion } from '../api/review';
import {
  currentQuestionOf,
  isFailed,
  isFinished,
  isSolved,
  pendingQuestionsOf,
  progressRangeOf,
} from './review-progress';

// completedAt은 "끝난 시각"이다 — 맞혀서 끝났는지는 wrongCount가 가른다
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

  it('끝난 시각이 있어도 두 번 틀렸으면 놓친 문제다', () => {
    const missed = question('q1', '2026-09-22T10:00', 2);

    expect(isSolved(missed)).toBe(false);
    expect(isFailed(missed)).toBe(true);
  });

  it('한 번 틀린 뒤 맞혀서 끝났으면 맞힌 문제다', () => {
    const solved = question('q1', '2026-09-22T10:00', 1);

    expect(isSolved(solved)).toBe(true);
    expect(isFailed(solved)).toBe(false);
  });

  it('첫 오답만 있는 문제는 아직 끝나지 않아 다시 낸다', () => {
    const state = review('q1', [question('q1', null, 1), question('q2')]);

    expect(pendingQuestionsOf(state)).toHaveLength(2);
  });

  it('끝난 문제는 맞혔든 놓쳤든 더 내지 않는다', () => {
    const state = review('q3', [
      question('q1', '2026-09-22T10:00'),
      question('q2', '2026-09-22T10:01', 2),
      question('q3'),
    ]);

    expect(pendingQuestionsOf(state).map((it) => it.questionId)).toEqual([
      'q3',
    ]);
  });

  it('전체 종료는 서버 status로 판단한다 — 맞힌 개수와 무관하다', () => {
    const allMissed = review(
      null,
      [
        question('q1', '2026-09-22T10:00', 2),
        question('q2', '2026-09-22T10:01', 2),
      ],
      'COMPLETED',
    );

    expect(isFinished(allMissed)).toBe(true);
  });

  it('문제가 다 끝난 것처럼 보여도 서버가 완료로 바꾸기 전이면 끝난 게 아니다', () => {
    const state = review(null, [question('q1', '2026-09-22T10:00')]);

    expect(isFinished(state)).toBe(false);
  });

  it('끝난 문제 수만큼 진행 구간이 앞으로 간다 — 놓친 문제도 센다', () => {
    const state = review('q3', [
      question('q1', '2026-09-22T10:00'),
      question('q2', '2026-09-22T10:01', 2),
      question('q3'),
    ]);

    expect(progressRangeOf(state)).toEqual([2 / 3, 1]);
  });

  it('문제가 없으면 진행 구간을 0에서 끝까지로 둔다', () => {
    expect(progressRangeOf(review(null, []))).toEqual([0, 1]);
  });
});
