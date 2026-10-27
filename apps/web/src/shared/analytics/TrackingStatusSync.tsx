'use client';

// iOS 광고 추적 허용(ATT) 응답을 계측하는 무렌더 컴포넌트 — 루트 레이아웃에 마운트. 뜨는 순간 셸에 묻고, 셸은 권한창 답이 날 때까지 기다렸다 회신한다
import { useEffect } from 'react';
import { EVENTS } from '@landit/analytics';

import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

import { setUserProperties, track } from './amplitude';

// REQUEST_TRACKING_STATUS / TRACKING_STATUS를 알아듣는 최소 브릿지 계약 버전
const REQUIRED_BRIDGE_VERSION = 13;

export const TrackingStatusSync = () => {
  useEffect(() => {
    // ATT는 iOS에만 있다 — 브라우저·Android·새 메시지를 모르는 구버전 셸은 왕복 자체를 생략한다
    const context = getNativeContext();
    if (
      context?.platform !== 'ios' ||
      context.bridgeVersion < REQUIRED_BRIDGE_VERSION
    ) {
      return;
    }

    // 구독을 먼저 걸고 묻는다 — 응답을 놓치지 않게
    const unsubscribe = subscribeFromNative((message) => {
      if (message.type !== 'TRACKING_STATUS') return;
      // 예전에 답해 둔 사람도 세도록 상태는 실행마다 올리고, 결정 이벤트는 이번에 권한창에 답했을 때만 남긴다
      setUserProperties({ att_status: message.status });
      if (message.prompted) {
        track(EVENTS.TRACKING_PERMISSION_DECIDED, {
          granted: message.status === 'granted',
        });
      }
    });
    postToNative({ type: 'REQUEST_TRACKING_STATUS' });
    return unsubscribe;
  }, []);

  return null;
};
