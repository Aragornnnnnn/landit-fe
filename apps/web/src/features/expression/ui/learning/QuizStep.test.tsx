// QuizStep 계약 검증 — 정답/오답 결과 시트, 정답 연출 슬롯(복습 재사용), 진행바 구간, 칩 선택 복원·보고
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SentenceQuiz } from '../../model/sentence-quiz';
import { QuizStep } from './QuizStep';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

afterEach(cleanup);

// 정답: "I win" — 뱅크는 BE가 섞어준 순서(id 0="win", id 1="I")
const quiz: SentenceQuiz = {
  writingQuestion: 'Who won?',
  writingQuestionTranslation: '누가 이겼어?',
  writingSentenceText: 'I win',
  writingSentenceTranslation: '내가 이겨',
  answerWords: ['I', 'win'],
  shuffledWords: ['win', 'I'],
};

const pickCorrectAnswer = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'I' }));
  await user.click(screen.getByRole('button', { name: 'win' }));
};

const pickWrongAnswer = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'win' }));
  await user.click(screen.getByRole('button', { name: 'I' }));
};

describe('QuizStep', () => {
  it('정답을 순서대로 골라 확인하면 정답 결과 시트를 보여준다', async () => {
    const user = userEvent.setup();
    render(
      <QuizStep
        quiz={quiz}
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    await pickCorrectAnswer(user);
    await user.click(screen.getByRole('button', { name: '확인할게요' }));

    expect(screen.getByText('정답이에요!')).toBeInTheDocument();
  });

  it('오답이면 correctSlot이 있어도 항상 기본 결과 시트를 보여준다', async () => {
    const user = userEvent.setup();
    render(
      <QuizStep
        quiz={quiz}
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        correctSlot={() => <div>커스텀 연출</div>}
      />,
    );

    await pickWrongAnswer(user);
    await user.click(screen.getByRole('button', { name: '확인할게요' }));

    expect(screen.getByText('아쉬워요')).toBeInTheDocument();
    expect(screen.queryByText('커스텀 연출')).not.toBeInTheDocument();
  });

  it('정답이고 correctSlot이 있으면 기본 결과 시트 대신 그 연출을 띄운다', async () => {
    const user = userEvent.setup();
    render(
      <QuizStep
        quiz={quiz}
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        correctSlot={() => <div>커스텀 연출</div>}
      />,
    );

    await pickCorrectAnswer(user);
    await user.click(screen.getByRole('button', { name: '확인할게요' }));

    expect(screen.getByText('커스텀 연출')).toBeInTheDocument();
    expect(screen.queryByText('정답이에요!')).not.toBeInTheDocument();
  });

  it('initialSelected로 고른 칩을 복원해 바로 확인할 수 있다', () => {
    render(
      <QuizStep
        quiz={quiz}
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        initialSelected={[1, 0]}
      />,
    );

    expect(screen.getByRole('button', { name: '확인할게요' })).toBeEnabled();
  });

  it('칩을 고르면 onSelectedChange로 선택 배열을 보고한다', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <QuizStep
        quiz={quiz}
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onSelectedChange={onSelectedChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'I' }));

    expect(onSelectedChange).toHaveBeenLastCalledWith([1]);
  });
});
