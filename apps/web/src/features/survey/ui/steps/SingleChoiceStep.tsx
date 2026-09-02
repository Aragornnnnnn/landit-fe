'use client';

// 단일 선택 — 고르면 바로 다음. "기타"만은 쓸 칸이 열리므로 다음 버튼으로 넘어간다
import { Button } from '@/shared/ui/Button';

import { useAdvanceAfterPress } from '../../lib/useAdvanceAfterPress';
import type { Answer } from '../../model/answers';
import {
  choiceOptions,
  optionLabel,
  OTHER_OPTION,
  type SingleQuestion,
} from '../../model/questions';
import { ChoiceCard } from '../ChoiceCard';
import { OtherInput } from './OtherInput';

interface SingleChoiceStepProps {
  question: SingleQuestion;
  titleId: string;
  answer: Answer | undefined;
  otherText: string;
  proceedLabel: string;
  submitting: boolean;
  onAnswer: (answer: Answer) => void;
  onOtherText: (text: string) => void;
  onNext: () => void;
}

export const SingleChoiceStep = ({
  question,
  titleId,
  answer,
  otherText,
  proceedLabel,
  submitting,
  onAnswer,
  onOtherText,
  onNext,
}: SingleChoiceStepProps) => {
  const pressAndAdvance = useAdvanceAfterPress(onNext);
  const options = choiceOptions(question);
  const isOtherChosen = answer === OTHER_OPTION;

  return (
    <>
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        className="mt-8 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1"
      >
        {options.map((option) => (
          <ChoiceCard
            key={option}
            role="radio"
            label={optionLabel(option)}
            checked={answer === option}
            onSelect={() =>
              option === OTHER_OPTION
                ? onAnswer(option)
                : pressAndAdvance(() => onAnswer(option))
            }
          />
        ))}
        {isOtherChosen && (
          <OtherInput value={otherText} onChange={onOtherText} />
        )}
      </div>
      {isOtherChosen && (
        <Button className="mt-4" loading={submitting} onClick={onNext}>
          {proceedLabel}
        </Button>
      )}
    </>
  );
};
