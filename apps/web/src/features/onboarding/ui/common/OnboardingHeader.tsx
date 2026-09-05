// 온보딩 상단 뒤로가기 버튼 + 스텝 인디케이터
'use client';

import { ChevronLeftIcon } from '@/shared/ui/Icons';
import { StepDots } from '@/shared/ui/StepDots';

import { type OnboardingStep } from '../../model/steps';

export const OnboardingHeader = ({
  step,
  stepOrder,
  onBack,
}: {
  step: OnboardingStep;
  // 환경에 따라 알림 스텝이 빠질 수 있어 순서를 플로우에서 받는다
  stepOrder: readonly OnboardingStep[];
  onBack: () => void;
}) => {
  const stepIndex = stepOrder.indexOf(step);

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

      <StepDots step={step} stepOrder={stepOrder} />
    </header>
  );
};
