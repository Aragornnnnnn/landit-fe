// QuizStep 계약 검증 — 정답/오답 결과 시트, 정답 연출 슬롯(복습 재사용), 진행바 구간, 칩 선택 복원·보고
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

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

// 답변 줄에 올라간 칩 — 뱅크에 남은 같은 단어의 자리는 비활성이라 활성 버튼이 올린 칩이다
const placedChip = (word: string) =>
  screen
    .getAllByRole('button', { name: word })
    .find((chip) => !(chip as HTMLButtonElement).disabled)!;

// jsdom엔 PointerEvent가 없어 좌표를 실어 보낼 수 있는 MouseEvent로 대신 쏜다
const pointerEvent = (type: string, x: number, y: number) =>
  new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });

// 칩을 왼쪽으로 끌어다 놓는다 — jsdom은 칩 자리를 모두 0으로 보고하므로 어디로 끌든 첫 자리로 간다
const dragToFront = (chip: HTMLElement) => {
  fireEvent(chip, pointerEvent('pointerdown', 100, 0));
  fireEvent(window, pointerEvent('pointermove', 0, 0));
  fireEvent(window, pointerEvent('pointerup', 0, 0));
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
        step="quiz"
        quiz={quiz}
        partner="chloe"
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
        step="quiz"
        quiz={quiz}
        partner="chloe"
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
        step="quiz"
        quiz={quiz}
        partner="chloe"
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
        step="quiz"
        quiz={quiz}
        partner="chloe"
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        initialSelected={[1, 0]}
      />,
    );

    expect(screen.getByRole('button', { name: '확인할게요' })).toBeEnabled();
  });

  it('칩을 하나도 올리지 않으면 확인할 수 없다', () => {
    render(
      <QuizStep
        step="quiz"
        quiz={quiz}
        partner="chloe"
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '확인할게요' })).toBeDisabled();
  });

  it('칩을 다 채우지 않고 확인하면 오답 결과 시트를 보여준다', async () => {
    const user = userEvent.setup();
    render(
      <QuizStep
        step="quiz"
        quiz={quiz}
        partner="chloe"
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'I' }));
    await user.click(screen.getByRole('button', { name: '확인할게요' }));

    expect(screen.getByText('아쉬워요')).toBeInTheDocument();
  });

  it('올린 칩을 끌어다 놓으면 그 자리로 순서가 바뀐다', () => {
    // given — "win"(id 0), "I"(id 1) 순서로 올려둔 상태
    const onSelectedChange = vi.fn();
    render(
      <QuizStep
        step="quiz"
        quiz={quiz}
        partner="chloe"
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        initialSelected={[0, 1]}
        onSelectedChange={onSelectedChange}
      />,
    );

    // when — 뒤에 있는 "I"를 앞자리로 끌어다 놓는다
    dragToFront(placedChip('I'));

    expect(onSelectedChange).toHaveBeenLastCalledWith([1, 0]);
  });

  it('칩을 끌고 나서 이어지는 클릭으로는 칩이 빠지지 않는다', () => {
    const onSelectedChange = vi.fn();
    render(
      <QuizStep
        step="quiz"
        quiz={quiz}
        partner="chloe"
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        initialSelected={[0, 1]}
        onSelectedChange={onSelectedChange}
      />,
    );

    const chip = placedChip('I');
    dragToFront(chip);
    fireEvent.click(chip);

    // 순서만 바뀌고 칩은 그대로 두 개다
    expect(onSelectedChange).toHaveBeenLastCalledWith([1, 0]);
  });

  it('칩을 고르면 onSelectedChange로 선택 배열을 보고한다', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <QuizStep
        step="quiz"
        quiz={quiz}
        partner="chloe"
        expressionId={1}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onSelectedChange={onSelectedChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'I' }));

    expect(onSelectedChange).toHaveBeenLastCalledWith([1]);
  });

  // 퀴즈·복습이 같은 컴포넌트를 쓰므로 스텝별로 다른 이벤트로 갈라져야 한다 — 안 그러면 복습이 퀴즈로 집계된다
  describe('계측', () => {
    it('퀴즈 스텝에서 확인하면 Quiz Answer Submitted로 찍는다', async () => {
      const user = userEvent.setup();
      render(
        <QuizStep
          step="quiz"
          quiz={quiz}
          partner="chloe"
          expressionId={7}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />,
      );

      await pickCorrectAnswer(user);
      await user.click(screen.getByRole('button', { name: '확인할게요' }));

      expect(track).toHaveBeenCalledWith('Quiz Answer Submitted', {
        expression_id: 7,
        is_correct: true,
        hint_level: 0,
      });
    });

    it('복습 스텝에서 확인하면 Review Answer Submitted로 찍는다', async () => {
      const user = userEvent.setup();
      render(
        <QuizStep
          step="review"
          partner="chloe"
          quiz={quiz}
          expressionId={7}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />,
      );

      await pickWrongAnswer(user);
      await user.click(screen.getByRole('button', { name: '확인할게요' }));

      expect(track).toHaveBeenCalledWith('Review Answer Submitted', {
        expression_id: 7,
        is_correct: false,
        hint_level: 0,
      });
    });

    it.each([['quiz'], ['review']] as const)(
      '%s 스텝에서 힌트를 보면 source가 그 스텝으로 찍힌다',
      async (step) => {
        const user = userEvent.setup();
        render(
          <QuizStep
            step={step}
            partner="chloe"
            quiz={quiz}
            expressionId={7}
            onBack={vi.fn()}
            onNext={vi.fn()}
          />,
        );

        await user.click(screen.getByRole('button', { name: /힌트 보기/ }));

        expect(track).toHaveBeenCalledWith('Hint Used', {
          source: step,
          level: 1,
        });
      },
    );
  });
});
