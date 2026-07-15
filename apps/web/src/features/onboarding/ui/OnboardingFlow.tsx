// 온보딩 플로우 — 스텝 상태와 스텝 조립
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Transition } from '@/shared/motion';
import { useAuthStore } from '@/shared/store/auth-store';

import { STEP_ORDER } from '../model/onboarding.constants';
import { type OnboardingStep } from '../model/onboarding.types';
import { IntroStep } from './IntroStep';
import { MicStep } from './MicStep';
import { OnboardingHeader } from './OnboardingHeader';
import { ScenarioStep } from './ScenarioStep';
import { SoundStep } from './SoundStep';
import { ThoughtStep } from './ThoughtStep';

export const OnboardingFlow = () => {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);

  const [step, setStep] = useState<OnboardingStep>('intro');
  // 스텝 이동 방향 — 슬라이드가 전진(1)이면 오른쪽에서, 후진(-1)이면 왼쪽에서 들어오게 한다
  const [direction, setDirection] = useState(1);

  const goTo = (next: OnboardingStep) => {
    setDirection(STEP_ORDER.indexOf(next) >= STEP_ORDER.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) goTo(STEP_ORDER[currentIndex - 1]);
  };

  const startConversation = () => {
    // TODO: 대화 화면 추가 시 첫 시나리오 대화로 진입하도록 교체
    router.replace('/');
  };

  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background text-foreground">
      <OnboardingHeader step={step} onBack={handleBack} />

      <Transition
        transitionKey={step}
        direction={direction}
        className="flex min-h-0 flex-1 flex-col px-6"
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top), 18px) + 58px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
        }}
      >
        {step === 'intro' && (
          <IntroStep
            nickname={member?.nickname ?? null}
            onNext={() => goTo('sound')}
          />
        )}
        {step === 'sound' && <SoundStep onNext={() => goTo('mic')} />}
        {step === 'mic' && (
          <MicStep
            // 권한 프롬프트 대기 중 스텝을 벗어났으면 무시한다
            onNext={() => {
              setDirection(1);
              setStep((prev) => (prev === 'mic' ? 'thought' : prev));
            }}
          />
        )}
        {step === 'thought' && <ThoughtStep onNext={() => goTo('scenario')} />}
        {step === 'scenario' && <ScenarioStep onStart={startConversation} />}
      </Transition>
    </main>
  );
};
