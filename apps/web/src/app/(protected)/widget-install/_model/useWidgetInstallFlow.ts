// widget-install 라우트의 흐름 — 목적지 판정·지원 게이트·재유도 기록·복귀 감지·네이티브 호출을 모은다.
// 페이지는 이 훅이 준 결과를 조립만 하고, 안내 화면은 InstallGuide가 그린다
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  recordReinvited,
  supportsWidgetInstall,
} from '@/features/widget/model/install-prompt';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { SCENARIO_PATH } from '@/shared/lib/routes';

export interface WidgetInstallFlow {
  // 위젯 없는 앱·브라우저로 직접 들어왔는지 — false면 안내를 그리지 않는다
  supported: boolean;
  onDecline: () => void;
  onAndroidPin: () => void;
  onLeaveHome: () => void;
}

export const useWidgetInstallFlow = (): WidgetInstallFlow => {
  const router = useRouter();
  const params = useSearchParams();

  // 안내를 닫으면 대화 플로우가 넘겨준 자리로 돌아간다 (없으면 기본 홈).
  // 내부 경로만 허용한다 — "//호스트"나 "/\호스트" 같은 프로토콜 상대 URL은 외부로 튀어 오픈 리다이렉트가 된다
  const next = params.get('next');
  const destination = next && /^\/(?![/\\])/.test(next) ? next : SCENARIO_PATH;
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
    // 2차 재유도를 띄웠다고 기록한다 — 이 화면에 온 것 자체가 노출이라 한 번으로 끝낸다 (계측은 InstallGuide가 한다)
    recordReinvited();
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

  return {
    supported,
    // 나중에 하기 — 홈으로 보낸다
    onDecline: finish,
    // 안드로이드 핀 요청 후 홈으로 보낸다
    onAndroidPin: () => {
      postToNative({ type: 'REQUEST_WIDGET_PIN' });
      finish();
    },
    // iOS 안내 마지막 — 실제로 홈 화면으로 내려보내 사용자가 위젯을 얹게 한다.
    // 셸이 없거나 못 내리면(브라우저 등) 앱 안 홈 탭으로 돌아가는 것으로 갈음한다
    onLeaveHome: () => {
      finish();
      postToNative({ type: 'GO_HOME' });
    },
  };
};
