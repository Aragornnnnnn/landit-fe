// 결과 화면 문구 분기 — 만점·일부 놓침·전부 놓침이 다른 말을 한다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ReviewQuestion } from '../api/review';
import { ReviewComplete } from './ReviewComplete';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

afterEach(cleanup);

const question = (id: string, solvedAt: string | null): ReviewQuestion =>
  ({
    questionId: id,
    expressionId: Number(id.slice(1)),
    targetExpressionText: `expression ${id}`,
    baseExpressionMeaningText: `뜻 ${id}`,
    quiz: {},
    displayOrder: 0,
    queueOrder: 0,
    wrongCount: solvedAt ? 0 : 2,
    completedAt: solvedAt,
  }) as unknown as ReviewQuestion;

const show = (questions: ReviewQuestion[]) =>
  render(
    <ReviewComplete questions={questions} justFinished onHome={vi.fn()} />,
  );

describe('ReviewComplete', () => {
  it('전부 맞히면 대화에서 써 보라고 한다', () => {
    show([
      question('q1', '2026-09-22T10:00'),
      question('q2', '2026-09-22T10:01'),
    ]);

    expect(
      screen.getByText('전부 맞혔어요. 대화에서 적극 활용해 보세요.'),
    ).toBeInTheDocument();
  });

  it('일부만 맞히면 개수를 세지 않고 다음을 기약한다', () => {
    show([question('q1', '2026-09-22T10:00'), question('q2', null)]);

    expect(
      screen.getByText('놓친 표현은 다음에 다시 만나요.'),
    ).toBeInTheDocument();
  });

  it('하나도 못 맞히면 먼저 달래고 같은 말을 건넨다', () => {
    show([question('q1', null), question('q2', null)]);

    expect(
      screen.getByText('괜찮아요. 놓친 표현은 다음에 다시 만나요.'),
    ).toBeInTheDocument();
  });

  it('제목은 결과와 무관하게 복습 완료다', () => {
    show([question('q1', null)]);

    expect(screen.getByText('복습 완료!')).toBeInTheDocument();
  });
});
