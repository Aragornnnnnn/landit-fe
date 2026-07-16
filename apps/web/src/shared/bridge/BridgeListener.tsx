'use client';

// 어느 화면에서든 항상 처리해야 하는 네이티브 메시지(뒤로가기 등)를 받는 전역 리스너 — 루트 레이아웃에 마운트
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { decideBack } from '@/shared/bridge/backNavigation';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';

export const BridgeListener = () => {
  const pathname = usePathname();
  const [exitOpen, setExitOpen] = useState(false);

  // 구독은 마운트에 한 번만 — 핸들러는 ref로 최신 경로·시트 상태를 읽는다 (라우트마다 재구독하지 않게)
  const pathnameRef = useRef(pathname);
  const exitOpenRef = useRef(exitOpen);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    exitOpenRef.current = exitOpen;
  }, [exitOpen]);

  useEffect(() => {
    const handleBackPressed = () => {
      // 종료 확인 시트가 떠 있으면 뒤로가기는 시트 닫기 — 안드로이드 관례
      if (exitOpenRef.current) {
        setExitOpen(false);
        return;
      }

      const navigation = (window as { navigation?: { canGoBack?: boolean } })
        .navigation;
      const decision = decideBack(
        pathnameRef.current,
        Boolean(navigation?.canGoBack),
      );

      if (decision === 'exit-confirm') setExitOpen(true);
      else if (decision === 'history-back') window.history.back();
      else postToNative({ type: 'EXIT_APP' });
    };

    return subscribeFromNative((message) => {
      if (message.type === 'BACK_PRESSED') handleBackPressed();
    });
  }, []);

  return (
    <ConfirmSheet
      open={exitOpen}
      title="앱을 종료할까요?"
      description="홈에서 뒤로가기를 누르면 앱이 종료돼요."
      confirmLabel="종료하기"
      continueLabel="계속하기"
      onConfirm={() => postToNative({ type: 'EXIT_APP' })}
      onClose={() => setExitOpen(false)}
    />
  );
};
