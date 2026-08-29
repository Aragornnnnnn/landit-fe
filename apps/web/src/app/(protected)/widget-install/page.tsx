// 위젯 설치 안내 — 온보딩 끝(설치 유도부터)과 재유도 시트(iOS 안내부터)가 함께 쓰는 화면 묶음
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  recordInstallAccepted,
  recordInstallInvited,
  supportsWidgetInstall,
} from '@/features/widget/model/install-prompt';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { ONBOARDED_PARAM, SCENARIO_PATH } from '@/shared/lib/routes';
import { Transition } from '@/shared/motion';

import { GuideHeader } from './_ui/GuideHeader';
import { InviteStep } from './_ui/InviteStep';
import { MenuStep } from './_ui/MenuStep';
import { PressStep } from './_ui/PressStep';
import { SearchStep } from './_ui/SearchStep';

type Step = 'invite' | 'press' | 'menu' | 'search';

// iOS 안내 3장 — 뒤로가기·진행점이 이 순서를 따른다 (설치 유도는 갈림길이라 제외)
const GUIDE_STEPS: Step[] = ['press', 'menu', 'search'];

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function WidgetInstallPage() {
  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6 text-foreground">
      <Suspense>
        <InstallFlow />
      </Suspense>
    </main>
  );
}

const InstallFlow = () => {
  const router = useRouter();
  const params = useSearchParams();
  // 재유도 시트에서 왔으면 설치는 이미 답했다 — iOS 안내부터 시작한다
  const fromReinvite = params.get('start') === 'guide';
  const [step, setStep] = useState<Step>(fromReinvite ? 'press' : 'invite');

  // 온보딩에서 왔으면 표식을 이어 달아, 끝난 뒤 홈이 첫 대화 유도를 계속한다
  const destination =
    params.get(ONBOARDED_PARAM) === '1'
      ? `${SCENARIO_PATH}?${ONBOARDED_PARAM}=1`
      : SCENARIO_PATH;
  // 재유도는 홈 탭에서 push로 들어와 back이 출발한 탭으로 돌려보낸다. 온보딩은 replace 체인이라 목적지로 간다
  const finish = () => {
    if (fromReinvite) router.back();
    else router.replace(destination);
  };
  // effect가 최신 finish를 읽게 한다 — 리스너는 한 번만 걸고 참조만 갈아끼운다
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  const supported = supportsWidgetInstall(getNativeContext());
  useEffect(() => {
    // 위젯 없는 앱·브라우저로 직접 들어온 URL은 조용히 홈으로 보낸다
    if (!supported) {
      router.replace(destination);
      return;
    }
    // 설치 유도는 한 번만 보여준다 — 노출 자체를 소비로 기록한다
    if (step === 'invite') recordInstallInvited();
    // 마운트 때 한 번 — 지원 여부·시작 스텝·목적지는 세션 동안 안 바뀐다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 위젯을 얹으러 홈으로 나갔다 돌아오면 안내를 닫는다 — 설치했든 안 했든 할 일은 끝났다.
  // 백그라운드로 갔다가(hidden) 다시 보이는(visible) 전환을 "돌아왔다"로 본다
  useEffect(() => {
    let leftApp = false;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') leftApp = true;
      else if (leftApp) finishRef.current();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (!supported) return null;

  // iOS 안내 마지막 — 실제로 홈 화면으로 내려보내 사용자가 위젯을 얹게 한다.
  // 셸이 없거나 못 내리면(브라우저 등) 앱 안 홈 탭으로 돌아가는 것으로 갈음한다
  const leaveToHome = () => {
    finish();
    postToNative({ type: 'GO_HOME' });
  };

  // 위젯 추가하기 — 안드로이드는 시스템 핀 다이얼로그로 직행, iOS는 갤러리 여는 길을 화면으로 안내한다.
  // 설치 길로 들어갔다고 기록해, 이후 재유도 시트가 같은 사람을 다시 붙잡지 않게 한다
  const add = () => {
    recordInstallAccepted();
    if (getNativeContext()?.platform === 'android') {
      postToNative({ type: 'REQUEST_WIDGET_PIN' });
      finish();
      return;
    }
    setStep('press');
  };

  // 안내 3장 안에서만 뒤로 간다 — 첫 장(press)에서 뒤로면 온보딩은 설치 유도로, 재유도는 시트로 되돌린다
  const guideIndex = GUIDE_STEPS.indexOf(step);
  const back = () => {
    if (guideIndex > 0) setStep(GUIDE_STEPS[guideIndex - 1]);
    else if (fromReinvite) router.back();
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
        {step === 'invite' && <InviteStep onAdd={add} onLater={finish} />}
        {step === 'press' && <PressStep onNext={() => setStep('menu')} />}
        {step === 'menu' && <MenuStep onNext={() => setStep('search')} />}
        {step === 'search' && <SearchStep onDone={leaveToHome} />}
      </Transition>
    </>
  );
};
