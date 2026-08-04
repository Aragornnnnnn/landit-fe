'use client';

// 어느 화면에서든 항상 처리해야 하는 네이티브 메시지(뒤로가기 등)를 받는 전역 리스너 — 루트 레이아웃에 마운트
import { useEffect, useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import { usePathname, useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { decideBack } from '@/shared/bridge/back-navigation';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';
import { closeTopSheet } from '@/shared/ui/bottom-sheet-back';
import { showToast, TOAST_MS } from '@/shared/ui/toast';

export const BridgeListener = () => {
  const pathname = usePathname();
  const router = useRouter();

  // 구독은 마운트에 한 번만 — 핸들러는 ref로 최신 경로·대기 상태를 읽는다 (라우트마다 재구독하지 않게)
  const pathnameRef = useRef(pathname);
  const exitArmedRef = useRef(false);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    pathnameRef.current = pathname;
    // 화면이 바뀌면 종료 대기를 푼다 — 다녀온 뒤 첫 뒤로가기가 안내 없이 앱을 끄지 않게
    exitArmedRef.current = false;
    window.clearTimeout(timerRef.current);
  }, [pathname]);

  useEffect(() => {
    const disarm = () => {
      exitArmedRef.current = false;
      window.clearTimeout(timerRef.current);
    };

    const routeBackPress = () => {
      // 바텀시트가 열려 있으면 뒤로가기는 시트 닫기 — 안드로이드 관례. 종료 대기도 푼다
      if (closeTopSheet()) {
        disarm();
        return;
      }

      const navigation = (window as { navigation?: { canGoBack?: boolean } })
        .navigation;
      const decision = decideBack(
        pathnameRef.current,
        Boolean(navigation?.canGoBack),
      );

      if (decision === 'history-back') {
        disarm();
        window.history.back();
        return;
      }
      if (decision === 'exit-app') {
        track(EVENTS.APP_EXITED, { trigger: 'back_button' });
        postToNative({ type: 'EXIT_APP' });
        return;
      }

      // 탭 화면 — 토스트를 띄우고, 노출 시간 안에 한 번 더 누르면 종료한다
      if (exitArmedRef.current) {
        track(EVENTS.APP_EXITED, { trigger: 'back_button' });
        postToNative({ type: 'EXIT_APP' });
        return;
      }
      exitArmedRef.current = true;
      showToast('한 번 더 누르면 앱이 종료돼요');
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        exitArmedRef.current = false;
      }, TOAST_MS);
    };

    return subscribeFromNative((message) => {
      if (message.type === 'BACK_PRESSED') routeBackPress();
      // 셸이 전달한 알림 탭 딥링크 — 웜 스타트에선 라우터 이동으로 처리한다
      if (message.type === 'NAVIGATE') router.push(message.url);
    });
    // router는 App Router에서 안정된 객체라 재구독이 일어나지 않는다
  }, [router]);

  return null;
};
