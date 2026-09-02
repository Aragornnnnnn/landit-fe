'use client';

// 1~5점 척도 — 점수를 누르면 바로 다음. 양 끝에 뜻을 달아 1과 5가 무엇인지 보여준다
import { useAdvanceAfterPress } from '../../lib/useAdvanceAfterPress';
import type { Answer } from '../../model/answers';
import { SCALE_MAX, type ScaleQuestion } from '../../model/questions';

const SCORES = Array.from({ length: SCALE_MAX }, (_, index) => index + 1);

export const ScaleStep = ({
  question,
  titleId,
  answer,
  onAnswer,
  onNext,
}: {
  question: ScaleQuestion;
  titleId: string;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  onNext: () => void;
}) => {
  const pressAndAdvance = useAdvanceAfterPress(onNext);

  return (
    <div className="mt-10">
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        className="flex justify-between gap-2"
      >
        {SCORES.map((score) => {
          const checked = answer === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-label={`${score}점`}
              aria-checked={checked}
              onClick={() => pressAndAdvance(() => onAnswer(score))}
              className={`flex aspect-square flex-1 items-center justify-center rounded-2xl text-xl font-extrabold transition-[translate,box-shadow,background-color,color] duration-75 ${
                checked
                  ? 'translate-y-[3px] bg-primary text-primary-foreground shadow-none'
                  : 'bg-card text-foreground shadow-[0_3px_0_var(--border)] active:translate-y-[3px] active:shadow-none'
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[13px] font-semibold text-muted-foreground">
        <span>{question.low}</span>
        <span>{question.high}</span>
      </div>
    </div>
  );
};
