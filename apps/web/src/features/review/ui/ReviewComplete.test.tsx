// 결과 화면 문구 분기 — 만점·일부 놓침·전부 놓침이 다른 말을 한다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ReviewQuestion } from '../api/review';
import { ReviewComplete } from './ReviewComplete';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

afterEach(cleanup);

// 문제는 정답 또는 두 번째 오답에서 끝난다 — 끝난 시각은 둘 다 있고, 맞혔는지는 오답 횟수가 가른다
const question = (id: string, solved: boolean): ReviewQuestion =>
  ({
    questionId: id,
    expressionId: Number(id.slice(1)),
    targetExpressionText: `expression ${id}`,
    baseExpressionMeaningText: `뜻 ${id}`,
    quiz: {},
    displayOrder: 0,
    queueOrder: 0,
    wrongCount: solved ? 0 : 2,
    completedAt: '2026-09-22T10:00',
  }) as unknown as ReviewQuestion;

const show = (questions: ReviewQuestion[]) =>
  render(
    <ReviewComplete questions={questions} justFinished onHome={vi.fn()} />,
  );

describe('ReviewComplete', () => {
  it('전부 맞히면 대화에서 써 보라고 한다', () => {
    show([question('q1', true), question('q2', true)]);

    expect(
      screen.getByText('전부 맞혔어요. 대화에서 적극 활용해 보세요.'),
    ).toBeInTheDocument();
  });

  it('일부만 맞히면 개수를 세지 않고 다음을 기약한다', () => {
    show([question('q1', true), question('q2', false)]);

    expect(
      screen.getByText('놓친 표현은 다음에 다시 만나요.'),
    ).toBeInTheDocument();
  });

  it('하나도 못 맞히면 먼저 달래고 같은 말을 건넨다', () => {
    show([question('q1', false), question('q2', false)]);

    expect(
      screen.getByText('괜찮아요. 놓친 표현은 다음에 다시 만나요.'),
    ).toBeInTheDocument();
  });

  it('제목은 결과와 무관하게 복습 완료다', () => {
    show([question('q1', false)]);

    expect(screen.getByText('복습 완료!')).toBeInTheDocument();
  });
});
