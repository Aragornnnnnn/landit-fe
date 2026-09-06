'use client';

// 복수 선택 — 여러 개 고르고 다음 버튼으로 넘어간다. 하나도 안 골랐으면 못 넘어간다
import { Button } from '@/shared/ui/Button';

import { toggleChoice } from '../../model/answers';
import {
  choiceOptions,
  optionLabel,
  OTHER_OPTION,
  type MultiQuestion,
} from '../../model/questions';
import { ChoiceCard } from '../ChoiceCard';
import type { ChoiceStepProps } from './ChoiceStepProps';
import { OtherInput } from './OtherInput';

interface MultiChoiceStepProps extends ChoiceStepProps {
  question: MultiQuestion;
}

export const MultiChoiceStep = ({
  question,
  titleId,
  answer,
  otherText,
  proceedLabel,
  submitting,
  onAnswer,
  onOtherText,
  onNext,
}: MultiChoiceStepProps) => {
  const options = choiceOptions(question);
  const chosen = Array.isArray(answer) ? answer : [];

  return (
    <>
      <div
        role="group"
        aria-labelledby={titleId}
        className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1"
      >
        {options.map((option) => (
          <ChoiceCard
            key={option}
            role="checkbox"
            label={optionLabel(option)}
            checked={chosen.includes(option)}
            onSelect={() => onAnswer(toggleChoice(answer, option))}
          />
        ))}
        {chosen.includes(OTHER_OPTION) && (
          <OtherInput value={otherText} onChange={onOtherText} />
        )}
      </div>
      <Button
        className="mt-4"
        disabled={chosen.length === 0}
        loading={submitting}
        onClick={onNext}
      >
        {proceedLabel}
      </Button>
    </>
  );
};
