// 위젯 설치 안내 흐름 — 유도부터 iOS 3장 안내까지 렌더·계측만 하고 네비·핀은 콜백에 맡긴다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS, type WidgetGuideStep } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { getNativeContext } from '@/shared/bridge/native-context';
import { Transition } from '@/shared/motion';

import { GuideHeader } from './GuideHeader';
import { InviteStep } from './InviteStep';
import { MenuStep } from './MenuStep';
import { PressStep } from './PressStep';
import { SearchStep } from './SearchStep';

type Step = 'invite' | 'press' | 'menu' | 'search';

// iOS 안내 3장 — 뒤로가기·진행점이 이 순서를 따른다 (설치 유도는 갈림길이라 제외)
const GUIDE_STEPS: Step[] = ['press', 'menu', 'search'];

export const InstallGuide = ({
  onDecline,
  onAndroidPin,
  onLeaveHome,
}: {
  onDecline: () => void;
  onAndroidPin: () => void;
  onLeaveHome: () => void;
}) => {
  const [step, setStep] = useState<Step>('invite');

  // 설치 유도 노출을 계측한다 — 마운트 때 한 번
  useEffect(() => {
    track(EVENTS.WIDGET_INSTALL_INVITE_VIEWED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 안내 스텝(press·menu·search)에 들어설 때마다 노출을 계측한다 — 어디서 이탈하는지 본다
  useEffect(() => {
    if (GUIDE_STEPS.includes(step)) {
      track(EVENTS.WIDGET_INSTALL_GUIDE_STEP_VIEWED, {
        step: step as WidgetGuideStep,
      });
    }
  }, [step]);

  // 위젯 추가하기 — 안드로이드는 시스템 핀 다이얼로그로 직행(호출자 몫), iOS는 갤러리 여는 길을 화면으로 안내한다
  const add = () => {
    track(EVENTS.WIDGET_INSTALL_INVITE_ANSWERED, { answer: 'install' });
    if (getNativeContext()?.platform === 'android') {
      track(EVENTS.WIDGET_PIN_REQUESTED, { platform: 'android' });
      onAndroidPin();
      return;
    }
    track(EVENTS.WIDGET_PIN_REQUESTED, { platform: 'ios' });
    setStep('press');
  };

  // 설치 유도에서 나중에 하기 — 미룬 답으로 계측하고 닫는 건 호출자에게 맡긴다
  const later = () => {
    track(EVENTS.WIDGET_INSTALL_INVITE_ANSWERED, { answer: 'dismiss' });
    onDecline();
  };

  // 안내 3장 안에서만 뒤로 간다 — 첫 장(press)에서 뒤로면 설치 유도로 되돌린다
  const guideIndex = GUIDE_STEPS.indexOf(step);
  const back = () => {
    if (guideIndex > 0) setStep(GUIDE_STEPS[guideIndex - 1]);
    else setStep('invite');
  };

  return (
    <>
      {/* 헤더는 전환 밖에 고정 — 내용만 슬라이드하고 뒤로가기·진행점은 제자리를 지킨다 */}
      {guideIndex >= 0 && (
        <GuideHeader
          index={guideIndex}
          total={GUIDE_STEPS.length}
          onBack={back}
        />
      )}
      <Transition
        transitionKey={step}
        direction={1}
        className="flex min-h-0 flex-1 flex-col"
        style={{
          // 안내 3장은 헤더(뒤로가기·진행점)를 피해 제목을 아래로 내린다
          paddingTop:
            guideIndex >= 0
              ? 'calc(max(env(safe-area-inset-top), 18px) + 48px)'
              : 'max(env(safe-area-inset-top), 18px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
        }}
      >
        {step === 'invite' && <InviteStep onAdd={add} onLater={later} />}
        {step === 'press' && <PressStep onNext={() => setStep('menu')} />}
        {step === 'menu' && <MenuStep onNext={() => setStep('search')} />}
        {step === 'search' && <SearchStep onDone={onLeaveHome} />}
      </Transition>
    </>
  );
};
