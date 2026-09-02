'use client';

// 문항 하나 — 종류에 따라 단일 선택·척도(누르면 바로 다음), 복수 선택(다음 버튼), 주관식(건너뛰기 가능).
// "기타 (직접 입력)"을 고르면 쓸 칸이 열리므로 그때만 단일 선택도 다음 버튼을 쓴다
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/ui/Button';

import { canProceed, toggleChoice, type Answer } from '../model/answers';
import {
  OTHER_LABEL,
  OTHER_OPTION,
  SCALE_MAX,
  type Question,
} from '../model/questions';
import { ChoiceCard } from './ChoiceCard';

// 단일 선택·척도는 눌린 것을 잠깐 보여주고 넘어간다 — 바로 넘기면 뭘 골랐는지 못 본다
const SELECT_DELAY_MS = 160;
const TEXT_MAX_LENGTH = 500;
const OTHER_MAX_LENGTH = 100;

interface QuestionStepProps {
  question: Question;
  answer: Answer | undefined;
  // 기타를 골랐을 때 직접 쓴 내용
  otherText: string;
  isLast: boolean;
  submitting: boolean;
  onAnswer: (answer: Answer) => void;
  onOtherText: (text: string) => void;
  onNext: () => void;
}

export const QuestionStep = ({
  question,
  answer,
  otherText,
  isLast,
  submitting,
  onAnswer,
  onOtherText,
  onNext,
}: QuestionStepProps) => {
  const [pending, setPending] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const chooseAndAdvance = (value: Answer) => {
    if (pending) return;
    setPending(true);
    onAnswer(value);
    timer.current = window.setTimeout(onNext, SELECT_DELAY_MS);
  };

  const chosen = Array.isArray(answer) ? answer : [];
  const text = typeof answer === 'string' ? answer : '';
  const proceedLabel = isLast ? '제출하기' : '다음';
  const options =
    (question.kind === 'single' || question.kind === 'multi') && question.other
      ? [...question.options, OTHER_OPTION]
      : question.kind === 'single' || question.kind === 'multi'
        ? question.options
        : [];
  const labelOf = (option: string) =>
    option === OTHER_OPTION ? OTHER_LABEL : option;

  const otherInput = (
    <input
      type="text"
      value={otherText}
      onChange={(event) => onOtherText(event.target.value)}
      maxLength={OTHER_MAX_LENGTH}
      placeholder="어떤 건지 적어주세요"
      aria-label="기타 내용"
      // 기타를 고른 직후라 바로 쓸 수 있게 초점을 준다
      autoFocus
      className="w-full shrink-0 rounded-2xl border border-border bg-card px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-7">
      <h1 className="shrink-0 text-3xl leading-[1.18] font-black tracking-normal break-keep whitespace-pre-line">
        {question.title}
      </h1>
      {(question.hint || question.kind === 'multi') && (
        <p className="mt-3 shrink-0 text-base font-bold text-muted-foreground">
          {question.hint ?? '여러 개 골라도 돼요'}
        </p>
      )}

      {question.kind === 'single' && (
        <>
          <div className="mt-8 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1">
            {options.map((option) => (
              <ChoiceCard
                key={option}
                label={labelOf(option)}
                selected={answer === option}
                onSelect={() =>
                  option === OTHER_OPTION
                    ? onAnswer(option)
                    : chooseAndAdvance(option)
                }
              />
            ))}
            {answer === OTHER_OPTION && otherInput}
          </div>
          {answer === OTHER_OPTION && (
            <Button className="mt-4" loading={submitting} onClick={onNext}>
              {proceedLabel}
            </Button>
          )}
        </>
      )}

      {question.kind === 'multi' && (
        <>
          <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1">
            {options.map((option) => (
              <ChoiceCard
                key={option}
                label={labelOf(option)}
                selected={chosen.includes(option)}
                check
                onSelect={() => onAnswer(toggleChoice(answer, option))}
              />
            ))}
            {chosen.includes(OTHER_OPTION) && otherInput}
          </div>
          <Button
            className="mt-4"
            disabled={!canProceed(question, answer)}
            loading={submitting}
            onClick={onNext}
          >
            {proceedLabel}
          </Button>
        </>
      )}

      {question.kind === 'scale' && (
        <div className="mt-10">
          <div className="flex justify-between gap-2">
            {Array.from({ length: SCALE_MAX }, (_, index) => index + 1).map(
              (score) => {
                const selected = answer === score;
                return (
                  <button
                    key={score}
                    type="button"
                    aria-label={`${score}점`}
                    aria-pressed={selected}
                    onClick={() => chooseAndAdvance(score)}
                    className={`flex aspect-square flex-1 items-center justify-center rounded-2xl text-xl font-extrabold transition-[translate,box-shadow,background-color,color] duration-75 ${
                      selected
                        ? 'translate-y-[3px] bg-primary text-primary-foreground shadow-none'
                        : 'bg-card text-foreground shadow-[0_3px_0_var(--border)] active:translate-y-[3px] active:shadow-none'
                    }`}
                  >
                    {score}
                  </button>
                );
              },
            )}
          </div>
          <div className="mt-3 flex justify-between text-[13px] font-semibold text-muted-foreground">
            <span>{question.low}</span>
            <span>{question.high}</span>
          </div>
        </div>
      )}

      {question.kind === 'text' && (
        <>
          <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto">
            <textarea
              value={text}
              onChange={(event) => onAnswer(event.target.value)}
              maxLength={TEXT_MAX_LENGTH}
              placeholder={question.placeholder}
              autoFocus
              className="h-[180px] w-full shrink-0 resize-none rounded-2xl border border-border bg-card p-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <Button className="mt-4" loading={submitting} onClick={onNext}>
            {text.trim()
              ? proceedLabel
              : isLast
                ? '건너뛰고 제출하기'
                : '건너뛰기'}
          </Button>
        </>
      )}
    </div>
  );
};
