'use client';

// 셸 알람 상태 훅 — 조회를 보내고, 어디서 보낸 요청의 회신이든 받아 갱신한다. 알람을 모르는 환경이면 null 그대로다
import { useEffect, useState } from 'react';
import type { AlarmStatus } from '@landit/bridge';

import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

import { alarmPlatform, isAlarmShell } from './shell-alarm';

// 마지막으로 본 알림 권한 — 화면의 훅이 여럿이어도 바뀔 때 한 번만 다시 묻는다
let lastNotification: string | null = null;

export const useAlarmStatus = () => {
  const [status, setStatus] = useState<AlarmStatus | null>(null);

  useEffect(() => {
    if (!isAlarmShell()) return;

    const unsubscribe = subscribeFromNative((message) => {
      // Android는 알림이 꺼지면 알람을 못 건다 — 알림 권한이 실제로 바뀌었을 때만 알람 상태를 다시 묻는다.
      // 알림 회신은 모든 구독자에게 가므로, 바뀐 걸 처음 본 훅 하나만 묻게 모듈에 기억해 둔다
      if (message.type === 'NOTIFICATION_PERMISSION') {
        if (alarmPlatform() !== 'android') return;
        const changed =
          lastNotification !== null && lastNotification !== message.status;
        lastNotification = message.status;
        if (changed) postToNative({ type: 'GET_ALARM_STATUS' });
        return;
      }
      if (message.type !== 'ALARM_STATUS') return;
      const { type: _, ...next } = message;
      setStatus(next);
    });
    postToNative({ type: 'GET_ALARM_STATUS' });

    // 설정 화면에서 권한을 켜고 돌아오면 다시 묻는다
    const requery = () => {
      if (document.visibilityState === 'visible')
        postToNative({ type: 'GET_ALARM_STATUS' });
    };
    document.addEventListener('visibilitychange', requery);

    return () => {
      document.removeEventListener('visibilitychange', requery);
      unsubscribe();
    };
  }, []);

  return status;
};
