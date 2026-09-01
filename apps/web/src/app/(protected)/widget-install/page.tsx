// 위젯 설치 안내 라우트 — 게이트·소비 기록·네비게이션을 맡고 안내 흐름은 InstallGuide에 위임한다
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  recordInstallInvited,
  supportsWidgetInstall,
} from '@/features/widget/model/install-prompt';
import { InstallGuide } from '@/features/widget/ui/install-guide/InstallGuide';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { ONBOARDED_PARAM, SCENARIO_PATH } from '@/shared/lib/routes';

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

  // 온보딩에서 왔으면 표식을 이어 달아, 끝난 뒤 홈이 첫 대화 유도를 계속한다
  const destination =
    params.get(ONBOARDED_PARAM) === '1'
      ? `${SCENARIO_PATH}?${ONBOARDED_PARAM}=1`
      : SCENARIO_PATH;
  // 온보딩은 replace 체인이라 안내를 닫으면 목적지(홈)로 간다
  const finish = () => router.replace(destination);
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
    // 설치 유도는 한 번만 보여준다 — 노출 자체를 소비로 기록한다 (계측은 InstallGuide가 한다)
    recordInstallInvited();
    // 마운트 때 한 번 — 지원 여부·목적지는 세션 동안 안 바뀐다
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

  return (
    <InstallGuide
      // 나중에 하기 — 홈으로 보낸다
      onDecline={finish}
      // 안드로이드 핀 요청 후 홈으로 보낸다
      onAndroidPin={() => {
        postToNative({ type: 'REQUEST_WIDGET_PIN' });
        finish();
      }}
      // iOS 안내 마지막 — 실제로 홈 화면으로 내려보내 사용자가 위젯을 얹게 한다.
      // 셸이 없거나 못 내리면(브라우저 등) 앱 안 홈 탭으로 돌아가는 것으로 갈음한다
      onLeaveHome={() => {
        finish();
        postToNative({ type: 'GO_HOME' });
      }}
    />
  );
};
