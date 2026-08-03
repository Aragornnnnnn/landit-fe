// 온보딩 플로우 — 스텝 상태와 스텝 조립
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { markOnboardingSeen } from '@/shared/auth/onboarding-seen';
import { Transition } from '@/shared/motion';

import { STEP_ORDER, type OnboardingStep } from '../model/steps';
import { IntroStep } from './IntroStep';
import { MicStep } from './MicStep';
import { NotificationStep } from './NotificationStep';
import { OnboardingHeader } from './OnboardingHeader';
import { ScenarioStep } from './ScenarioStep';
import { SoundStep } from './SoundStep';
import { ThoughtStep } from './ThoughtStep';

export const OnboardingFlow = () => {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  // 물어볼 수 있는 상태(undetermined)에만 알림 스텝을 넣는다 — 이미 확정(granted·denied)이거나 요청 수단이 없으면(unavailable) 5스텝
  const canAskNotification = useNotificationPermission() === 'undetermined';
  const stepOrder: readonly OnboardingStep[] = canAskNotification
    ? STEP_ORDER
    : STEP_ORDER.filter((step) => step !== 'notification');

  const [step, setStep] = useState<OnboardingStep>('intro');
  // 스텝 이동 방향 — 슬라이드가 전진(1)이면 오른쪽에서, 후진(-1)이면 왼쪽에서 들어오게 한다
  const [direction, setDirection] = useState(1);
  // 지연 콜백(마이크 권한 프롬프트)이 최신 스텝을 읽기 위한 ref — 스텝을 벗어났으면 완료로 치지 않는다
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    track(EVENTS.ONBOARDING_STARTED);
  }, []);

  // 첫 스텝(intro)과 이후 모든 스텝 전환을 노출로 기록한다
  useEffect(() => {
    track(EVENTS.ONBOARDING_STEP_VIEWED, {
      step,
      step_index: stepOrder.indexOf(step),
    });
    // stepOrder는 step이 바뀔 때만 기록하면 된다 — 같은 스텝에서 순서가 바뀌는 경우는 노출이 아니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goTo = (next: OnboardingStep) => {
    setDirection(stepOrder.indexOf(next) >= stepOrder.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  // 전진 CTA에서만 부른다 — 뒤로가기는 완료가 아니다
  const finishStep = (completed: OnboardingStep, next: OnboardingStep) => {
    track(EVENTS.ONBOARDING_STEP_COMPLETED, { step: completed });
    goTo(next);
  };

  const stepBack = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) goTo(stepOrder[currentIndex - 1]);
  };

  // 소개한 첫 시나리오 대화로 곧장 들어간다 — 리스트 경유 없이. 시나리오를 못 받았으면 홈으로 폴백
  const startConversation = (scenarioId: number | null) => {
    track(EVENTS.ONBOARDING_STEP_COMPLETED, { step: 'scenario' });
    track(EVENTS.ONBOARDING_COMPLETED);
    // 끝까지 본 기기로 기록해 재로그인 시 온보딩을 다시 보여주지 않는다
    markOnboardingSeen();
    router.replace(
      scenarioId != null ? `/conversation/${scenarioId}` : '/home',
    );
  };

  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background text-foreground">
      <OnboardingHeader step={step} stepOrder={stepOrder} onBack={stepBack} />

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
            onNext={() => finishStep('intro', 'sound')}
          />
        )}
        {step === 'sound' && (
          <SoundStep onNext={() => finishStep('sound', 'mic')} />
        )}
        {step === 'mic' && (
          <MicStep
            // 권한 프롬프트 대기 중 스텝을 벗어났으면 무시한다 — 완료 이벤트도 함께 막는다
            onNext={() => {
              if (stepRef.current !== 'mic') return;
              track(EVENTS.ONBOARDING_STEP_COMPLETED, { step: 'mic' });
              setDirection(1);
              setStep((prev) => (prev === 'mic' ? 'thought' : prev));
            }}
          />
        )}
        {step === 'thought' && (
          <ThoughtStep
            onNext={() =>
              finishStep(
                'thought',
                stepOrder.includes('notification')
                  ? 'notification'
                  : 'scenario',
              )
            }
          />
        )}
        {step === 'notification' && (
          <NotificationStep
            // 실제 권한 요청(REQUEST_NOTIFICATION_PERMISSION)은 브릿지 확장 후 배선한다.
            // 여기서 답하면 OS 권한 상태가 확정되므로 홈의 동의 게이트는 저절로 조용해진다
            onNext={() => finishStep('notification', 'scenario')}
          />
        )}
        {step === 'scenario' && <ScenarioStep onStart={startConversation} />}
      </Transition>
    </main>
  );
};
