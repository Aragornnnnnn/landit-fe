'use client';

// "다른 방법" 다음 화면 — 어떤 방법인지 라디오 4개. 골라야 "다음"이 살고, 아래 작은 링크로는 바로 스토어로 갈 수 있다
import type { StudyMethod } from '@landit/analytics';

import { Button } from '@/shared/ui/Button';

import { STUDY_METHODS } from '../_model/cancel-reasons';
import { ChoiceRow } from './ChoiceRow';
import { StepFooter } from './StepFooter';

interface MethodStepProps {
  method: StudyMethod | null;
  onMethod: (method: StudyMethod) => void;
  onNext: () => void;
  leaveLink: React.ReactNode;
}

const TITLE_ID = 'cancel-method-title';

export const MethodStep = ({
  method,
  onMethod,
  onNext,
  leaveLink,
}: MethodStepProps) => (
  <>
    <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
      <h1
        id={TITLE_ID}
        className="text-[22px] leading-[1.35] font-bold text-foreground"
      >
        어떤 방법으로
        <br />
        공부하실 예정이에요?
      </h1>
      <div
        role="radiogroup"
        aria-labelledby={TITLE_ID}
        className="mt-6 flex flex-col gap-2"
      >
        {STUDY_METHODS.map((option) => (
          <ChoiceRow
            key={option.id}
            emoji={option.emoji}
            label={option.label}
            checked={method === option.id}
            onSelect={() => onMethod(option.id)}
          />
        ))}
      </div>
    </div>
    <StepFooter
      primary={
        <Button disabled={method === null} onClick={onNext}>
          다음
        </Button>
      }
      link={leaveLink}
    />
  </>
);
