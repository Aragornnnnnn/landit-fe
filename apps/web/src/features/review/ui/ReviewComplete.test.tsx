// 결과 화면 문구 분기 — 만점·일부 놓침·전부 놓침이 다른 말을 한다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ReviewQuestion } from '../api/review';
import { ReviewComplete } from './ReviewComplete';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 어느 그림인지만 src로 남긴다
vi.mock('next/image', () => ({
  default: ({ src }: { src: string }) => <span data-src={src} />,
}));

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
  it('전부 맞히면 완벽하다고 축하하고 대화에서 써 보라고 한다', () => {
    show([question('q1', true), question('q2', true)]);

    expect(screen.getByText('완벽해요!')).toBeInTheDocument();
    expect(
      screen.getByText('전부 맞혔어요. 대화에서 적극 활용해 보세요.'),
    ).toBeInTheDocument();
  });

  it('일부만 맞히면 칭찬하고 다음 복습을 기약한다', () => {
    show([question('q1', true), question('q2', true), question('q3', false)]);

    expect(screen.getByText('잘했어요!')).toBeInTheDocument();
    expect(
      screen.getByText('틀린 표현은 다음 복습에서 마스터해봐요.'),
    ).toBeInTheDocument();
  });

  it('하나도 못 맞히면 달래고 다음 복습을 기약한다', () => {
    show([question('q1', false), question('q2', false)]);

    expect(screen.getByText('괜찮아요!')).toBeInTheDocument();
    expect(
      screen.getByText('틀린 표현은 다음 복습에서 마스터해봐요.'),
    ).toBeInTheDocument();
  });

  it('만점이면 100점 래디가 나온다', () => {
    const { container } = show([question('q1', true)]);

    expect(
      container.querySelector('[data-src]')?.getAttribute('data-src'),
    ).toContain('landy-review-perfect');
  });

  it('하나라도 놓치면 공부하는 래디가 나온다', () => {
    const { container } = show([question('q1', true), question('q2', false)]);

    expect(
      container.querySelector('[data-src]')?.getAttribute('data-src'),
    ).toContain('landy-review-study');
  });
});
