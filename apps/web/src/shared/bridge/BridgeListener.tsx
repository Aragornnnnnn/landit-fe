'use client';

// 어느 화면에서든 항상 처리해야 하는 네이티브 메시지(뒤로가기 등)를 받는 전역 리스너 — 루트 레이아웃에 마운트
import { useEffect } from 'react';

import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

const handleBackPressed = () => {
  const navigation = (window as { navigation?: { canGoBack?: boolean } })
    .navigation;

  if (navigation?.canGoBack) {
    window.history.back();
  } else {
    postToNative({ type: 'EXIT_APP' });
  }
};

export const BridgeListener = () => {
  useEffect(
    () =>
      subscribeFromNative((message) => {
        if (message.type === 'BACK_PRESSED') handleBackPressed();
      }),
    [],
  );

  return null;
};
