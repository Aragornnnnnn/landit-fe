// 온보딩 상단 뒤로가기 버튼 + 스텝 인디케이터
'use client';

import { ChevronLeftIcon } from '@/shared/ui/Icons';

import { STEP_ORDER } from '../model/onboarding.constants';
import { type OnboardingStep } from '../model/onboarding.types';

export const OnboardingHeader = ({
  step,
  onBack,
}: {
  step: OnboardingStep;
  onBack: () => void;
}) => {
  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <header
      className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 18px)' }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="이전"
        disabled={stepIndex === 0}
        className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-opacity active:bg-black/5 disabled:opacity-0"
      >
        <ChevronLeftIcon size={28} strokeWidth={2.8} />
      </button>

      <div className="flex items-center gap-1.5">
        {STEP_ORDER.map((item, index) => (
          <span
            key={item}
            className={`h-1.5 rounded-full transition-all duration-300 ${index <= stepIndex ? 'bg-foreground' : 'bg-border'}`}
            style={{
              width: index === stepIndex ? 18 : 6,
              opacity: index === stepIndex ? 0.95 : 0.6,
            }}
          />
        ))}
      </div>
    </header>
  );
};
