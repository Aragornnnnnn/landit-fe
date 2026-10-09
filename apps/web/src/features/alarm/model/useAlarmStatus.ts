'use client';

// 셸 알람 상태 훅 — 조회를 보내고, 어디서 보낸 요청의 회신이든 받아 갱신한다. 알람을 모르는 환경이면 null 그대로다
import { useEffect, useState } from 'react';
import type { AlarmStatus } from '@landit/bridge';

import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

import { isAlarmShell } from './shell-alarm';

export const useAlarmStatus = () => {
  const [status, setStatus] = useState<AlarmStatus | null>(null);

  useEffect(() => {
    if (!isAlarmShell()) return;

    const unsubscribe = subscribeFromNative((message) => {
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
