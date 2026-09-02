'use client';

// 문항 하나 — 제목·보조 문구를 그리고, 종류별 화면에 넘긴다. 종류마다 진행 방식이 달라 각자 컴포넌트로 산다
import { useId } from 'react';

import type { Answer } from '../model/answers';
import type { Question } from '../model/questions';
import { MultiChoiceStep } from './steps/MultiChoiceStep';
import { ScaleStep } from './steps/ScaleStep';
import { SingleChoiceStep } from './steps/SingleChoiceStep';
import { TextStep } from './steps/TextStep';

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
  // 선택지 묶음이 제목을 이름으로 쓴다 — 낭독기가 "무엇을 고르는 묶음"인지 읽는다
  const titleId = useId();
  const proceedLabel = isLast ? '제출하기' : '다음';
  const hint =
    question.hint ?? (question.kind === 'multi' ? '여러 개 골라도 돼요' : null);

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-7">
      <h1
        id={titleId}
        className="shrink-0 text-3xl leading-[1.18] font-black tracking-normal break-keep whitespace-pre-line"
      >
        {question.title}
      </h1>
      {hint && (
        <p className="mt-3 shrink-0 text-base font-bold text-muted-foreground">
          {hint}
        </p>
      )}

      {question.kind === 'single' && (
        <SingleChoiceStep
          question={question}
          titleId={titleId}
          answer={answer}
          otherText={otherText}
          proceedLabel={proceedLabel}
          submitting={submitting}
          onAnswer={onAnswer}
          onOtherText={onOtherText}
          onNext={onNext}
        />
      )}
      {question.kind === 'multi' && (
        <MultiChoiceStep
          question={question}
          titleId={titleId}
          answer={answer}
          otherText={otherText}
          proceedLabel={proceedLabel}
          submitting={submitting}
          onAnswer={onAnswer}
          onOtherText={onOtherText}
          onNext={onNext}
        />
      )}
      {question.kind === 'scale' && (
        <ScaleStep
          question={question}
          titleId={titleId}
          answer={answer}
          onAnswer={onAnswer}
          onNext={onNext}
        />
      )}
      {question.kind === 'text' && (
        <TextStep
          question={question}
          answer={answer}
          isLast={isLast}
          submitting={submitting}
          onAnswer={onAnswer}
          onNext={onNext}
        />
      )}
    </div>
  );
};
