// 온보딩 플로우 — 스텝 상태와 스텝 조립
'use client';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/store/auth-store';

import { STEP_ORDER } from '../model/onboarding.constants';
import { type OnboardingStep } from '../model/onboarding.types';
import { IntroStep } from './IntroStep';
import { MicStep } from './MicStep';
import { OnboardingHeader } from './OnboardingHeader';
import { ScenarioStep } from './ScenarioStep';
import { SoundStep } from './SoundStep';
import { StepMotion } from './StepMotion';
import { ThoughtStep } from './ThoughtStep';

export const OnboardingFlow = () => {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);

  const [step, setStep] = useState<OnboardingStep>('intro');

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) setStep(STEP_ORDER[currentIndex - 1]);
  };

  const startConversation = () => {
    // TODO: 대화 화면 추가 시 첫 시나리오 대화로 진입하도록 교체
    router.replace('/');
  };

  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background text-foreground">
      <OnboardingHeader step={step} onBack={handleBack} />

      <AnimatePresence mode="wait">
        <StepMotion key={step}>
          {step === 'intro' && (
            <IntroStep
              nickname={member?.nickname ?? null}
              onNext={() => setStep('sound')}
            />
          )}
          {step === 'sound' && <SoundStep onNext={() => setStep('mic')} />}
          {step === 'mic' && (
            <MicStep
              // 권한 프롬프트 대기 중 스텝을 벗어났으면 무시한다
              onNext={() =>
                setStep((prev) => (prev === 'mic' ? 'thought' : prev))
              }
            />
          )}
          {step === 'thought' && (
            <ThoughtStep onNext={() => setStep('scenario')} />
          )}
          {step === 'scenario' && <ScenarioStep onStart={startConversation} />}
        </StepMotion>
      </AnimatePresence>
    </main>
  );
};
