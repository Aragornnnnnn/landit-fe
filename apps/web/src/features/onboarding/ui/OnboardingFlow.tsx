// 온보딩 플로우 — 스텝 상태와 스텝 조립
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { requestNotificationPermission } from '@/features/notification/model/request-permission';
import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import {
  shouldInviteInstall,
  supportsWidgetInstall,
} from '@/features/widget/model/install-prompt';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { markOnboardingSeen } from '@/shared/auth/onboarding-seen';
import { getNativeContext } from '@/shared/bridge/native-context';
import { subscribeFromNative } from '@/shared/bridge/web-bridge';
import {
  ONBOARDED_PARAM,
  SCENARIO_PATH,
  WIDGET_INSTALL_PATH,
} from '@/shared/lib/routes';
import { Transition } from '@/shared/motion';

import { STEP_ORDER, type OnboardingStep } from '../model/steps';
import { useSaveAccentMutation } from '../model/useSaveAccentMutation';
import { useSaveLearningLevelMutation } from '../model/useSaveLearningLevelMutation';
import { OnboardingHeader } from './common/OnboardingHeader';
import { AccentStep } from './steps/AccentStep';
import { IntroStep } from './steps/IntroStep';
import { LampStep } from './steps/LampStep';
import { LevelStep } from './steps/LevelStep';
import { MicStep } from './steps/MicStep';
import { NotificationStep } from './steps/NotificationStep';
import { SoundStep } from './steps/SoundStep';
import { ThoughtStep } from './steps/ThoughtStep';

export const OnboardingFlow = () => {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  // 저장 응답을 기다리지 않고 다음 스텝으로 간다 — 고른 값은 캐시에 바로 심겨서
  // 온보딩 직후 홈에 도착해도 게이트가 같은 걸 다시 묻지 않는다
  const saveLearningLevel = useSaveLearningLevelMutation();
  const saveAccent = useSaveAccentMutation();
  // 물어볼 수 있는 상태(undetermined)에만 알림 스텝을 넣는다 — 이미 확정(granted·denied)이거나 요청 수단이 없으면(unavailable) 5스텝
  const canAskNotification = useNotificationPermission() === 'undetermined';

  const [step, setStep] = useState<OnboardingStep>('intro');
  // 스텝 이동 방향 — 슬라이드가 전진(1)이면 오른쪽에서, 후진(-1)이면 왼쪽에서 들어오게 한다
  const [direction, setDirection] = useState(1);
  // 알림 스텝에 머무는 동안엔 (OS 팝업 응답으로 권한이 확정돼도) 스텝을 목록에서 유지한다 — 현재 스텝 index가 사라지는 레이스 방지
  const stepOrder: readonly OnboardingStep[] =
    canAskNotification || step === 'notification'
      ? STEP_ORDER
      : STEP_ORDER.filter((item) => item !== 'notification');
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
      // index는 전체 스텝 기준 고정값 — 알림 스텝 포함 여부로 뒤 스텝 번호가 흔들리지 않게 한다
      step_index: STEP_ORDER.indexOf(step),
    });
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

  // 알림 스텝 대기 — CTA가 띄운 OS 팝업의 회신이 오면 다음 스텝으로 (마이크 스텝과 같은 완료 방식).
  // 부팅 시 조회 회신은 알림 스텝에 있지 않아 걸러진다
  useEffect(
    () =>
      subscribeFromNative((message) => {
        if (message.type !== 'NOTIFICATION_PERMISSION') return;
        if (stepRef.current !== 'notification') return;
        track(EVENTS.ONBOARDING_STEP_COMPLETED, { step: 'notification' });
        setDirection(1);
        setStep((prev) => (prev === 'notification' ? 'level' : prev));
      }),
    [],
  );

  const stepBack = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) goTo(stepOrder[currentIndex - 1]);
  };

  // 홈으로 보낸다 — 거기서 램프가 열리며 오늘 대화로 이어진다.
  // onboarded 표식을 달면 홈이 다시 묻지 않는다 (방금 시작하겠다고 답했다)
  const startFirstConversation = () => {
    track(EVENTS.ONBOARDING_STEP_COMPLETED, { step: 'scenario' });
    track(EVENTS.ONBOARDING_COMPLETED);
    // 끝까지 본 기기로 기록해 재로그인 시 온보딩을 다시 보여주지 않는다
    markOnboardingSeen();
    // 위젯 있는 앱이면 설치 유도를 한 장 끼운다 — 끝나면 같은 표식을 이어받아 홈이 첫 대화를 계속한다
    if (supportsWidgetInstall(getNativeContext()) && shouldInviteInstall()) {
      router.replace(`${WIDGET_INSTALL_PATH}?${ONBOARDED_PARAM}=1`);
      return;
    }
    router.replace(`${SCENARIO_PATH}?${ONBOARDED_PARAM}=1`);
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
                stepOrder.includes('notification') ? 'notification' : 'level',
              )
            }
          />
        )}
        {step === 'notification' && (
          <NotificationStep
            // OS 권한창만 요청한다 — 회신은 useNotificationPermission이 받고, 아래 effect가 확정을 보고 다음 스텝으로 넘긴다.
            // 여기서 답하면 권한 상태가 확정되므로 홈의 동의 게이트는 저절로 조용해진다
            onNext={() => requestNotificationPermission('onboarding')}
          />
        )}
        {step === 'level' && (
          <LevelStep
            onNext={(level) => {
              saveLearningLevel.mutate(level);
              finishStep('level', 'accent');
            }}
          />
        )}
        {step === 'accent' && (
          <AccentStep
            onNext={(locale) => {
              saveAccent.mutate(locale);
              finishStep('accent', 'scenario');
            }}
          />
        )}
        {step === 'scenario' && <LampStep onStart={startFirstConversation} />}
      </Transition>
    </main>
  );
};
