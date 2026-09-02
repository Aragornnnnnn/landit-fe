// 안내 3장 상단 — 뒤로가기 + 진행점. 온보딩 헤더와 같은 결로 "몇 번째 안내인지" 보여준다
'use client';

import { StepDots } from '@/features/onboarding/ui/common/StepDots';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

export const GuideHeader = <Step extends string>({
  step,
  stepOrder,
  onBack,
}: {
  step: Step;
  stepOrder: readonly Step[];
  onBack: () => void;
}) => (
  <header
    className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5"
    style={{ paddingTop: 'max(env(safe-area-inset-top), 18px)' }}
  >
    <button
      type="button"
      onClick={onBack}
      aria-label="이전"
      className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-opacity active:bg-black/5"
    >
      <ChevronLeftIcon size={28} strokeWidth={2.8} />
    </button>

    <StepDots step={step} stepOrder={stepOrder} />
  </header>
);
