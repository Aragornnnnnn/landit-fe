'use client';

// OS 알림 권한 상태 훅 — 셸에 조회를 보내고 회신으로 갱신한다. unavailable은 권한 체계를 쓸 수 없는 환경(일반 브라우저·구버전 셸)
import { useEffect, useState } from 'react';

import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

// 알림 메시지(GET/REQUEST/NOTIFICATION_PERMISSION)를 알아듣는 최소 브릿지 계약 버전
const REQUIRED_BRIDGE_VERSION = 2;

export type NotificationPermissionStatus =
  'granted' | 'denied' | 'undetermined' | 'unavailable';

export const useNotificationPermission = (): NotificationPermissionStatus => {
  const [status, setStatus] =
    useState<NotificationPermissionStatus>('unavailable');

  useEffect(() => {
    // 셸이 없거나(브라우저) 새 메시지를 모르는 구버전 셸이면 왕복 자체를 생략한다 — unavailable 유지
    const context = getNativeContext();
    if (!context || context.bridgeVersion < REQUIRED_BRIDGE_VERSION) return;

    // 회신 구독을 먼저 걸고 조회를 보낸다 — 어디서든 REQUEST가 일으킨 회신도 같이 받아 모든 소비처가 동기화된다
    const unsubscribe = subscribeFromNative((message) => {
      if (message.type === 'NOTIFICATION_PERMISSION') setStatus(message.status);
    });
    postToNative({ type: 'GET_NOTIFICATION_PERMISSION' });

    // 포그라운드 복귀 시 재조회 — OS 설정에서 권한을 바꾸고 돌아온 경우를 그 세션 안에서 반영한다
    const requery = () => {
      if (document.visibilityState === 'visible')
        postToNative({ type: 'GET_NOTIFICATION_PERMISSION' });
    };
    document.addEventListener('visibilitychange', requery);

    return () => {
      document.removeEventListener('visibilitychange', requery);
      unsubscribe();
    };
  }, []);

  return status;
};
