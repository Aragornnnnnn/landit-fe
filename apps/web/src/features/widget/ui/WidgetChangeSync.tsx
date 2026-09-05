'use client';

// 셸이 넘긴 위젯 추가·삭제를 계측한다 — 루트 레이아웃에 마운트. 뜨는 순간 쌓인 것을 청하고, 이후는 셸이 그때그때 보낸다
import { useEffect } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

// REQUEST_WIDGET_CHANGES / WIDGET_CHANGED를 알아듣는 최소 브릿지 계약 버전
const REQUIRED_BRIDGE_VERSION = 4;

export const WidgetChangeSync = () => {
  useEffect(() => {
    // 셸이 없거나(브라우저) 새 메시지를 모르는 구버전 셸이면 왕복 자체를 생략한다
    const context = getNativeContext();
    if (!context || context.bridgeVersion < REQUIRED_BRIDGE_VERSION) return;

    // 구독을 먼저 걸고 청한다 — 청한 응답을 놓치지 않게
    const unsubscribe = subscribeFromNative((message) => {
      if (message.type !== 'WIDGET_CHANGED') return;
      track(
        message.change === 'added'
          ? EVENTS.WIDGET_INSTALLED
          : EVENTS.WIDGET_REMOVED,
        { family: message.family },
      );
    });
    postToNative({ type: 'REQUEST_WIDGET_CHANGES' });
    return unsubscribe;
  }, []);

  return null;
};
