// 위젯 설치 안내 — 온보딩 끝(설치 유도부터)과 재유도 시트(iOS 안내부터)가 함께 쓰는 화면 묶음
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  recordInstallDeferred,
  recordInstallInvited,
  supportsWidgetInstall,
} from '@/features/widget/model/install-prompt';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { ONBOARDED_PARAM, SCENARIO_PATH } from '@/shared/lib/routes';
import { Transition } from '@/shared/motion';

import { InviteStep } from './_ui/InviteStep';
import { MenuStep } from './_ui/MenuStep';
import { PressStep } from './_ui/PressStep';
import { SearchStep } from './_ui/SearchStep';

type Step = 'invite' | 'press' | 'menu' | 'search';

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
  const [step, setStep] = useState<Step>(
    params.get('start') === 'guide' ? 'press' : 'invite',
  );

  // 온보딩에서 왔으면 표식을 이어 달아, 끝난 뒤 홈이 첫 대화 유도를 계속한다
  const destination =
    params.get(ONBOARDED_PARAM) === '1'
      ? `${SCENARIO_PATH}?${ONBOARDED_PARAM}=1`
      : SCENARIO_PATH;
  const finish = () => router.replace(destination);

  // 위젯 없는 앱·브라우저로 직접 들어온 URL은 조용히 홈으로 보낸다
  const supported = supportsWidgetInstall(getNativeContext());
  useEffect(() => {
    if (!supported) router.replace(destination);
    // 마운트 때 한 번 — 지원 여부와 목적지는 세션 동안 안 바뀐다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 설치 유도는 한 번만 보여준다 — 노출 자체를 소비로 기록한다
  useEffect(() => {
    if (supported && step === 'invite') recordInstallInvited();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  // 위젯 추가하기 — 안드로이드는 시스템 핀 다이얼로그로 직행, iOS는 갤러리 여는 길을 화면으로 안내한다
  const add = () => {
    if (getNativeContext()?.platform === 'android') {
      postToNative({ type: 'REQUEST_WIDGET_PIN' });
      finish();
      return;
    }
    setStep('press');
  };

  const later = () => {
    recordInstallDeferred();
    finish();
  };

  return (
    <Transition
      transitionKey={step}
      direction={1}
      className="flex min-h-0 flex-1 flex-col"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 18px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
    >
      {step === 'invite' && <InviteStep onAdd={add} onLater={later} />}
      {step === 'press' && <PressStep onNext={() => setStep('menu')} />}
      {step === 'menu' && <MenuStep onNext={() => setStep('search')} />}
      {step === 'search' && <SearchStep onDone={finish} />}
    </Transition>
  );
};
