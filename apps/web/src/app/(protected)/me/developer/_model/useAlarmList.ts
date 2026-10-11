'use client';

// 셸에 걸린 알람 목록 — 열 때·돌아올 때·알람 상태가 바뀔 때마다 다시 묻는다. 알람을 모르는 셸이면 null 그대로다
import { useEffect, useState } from 'react';
import type { ScheduledAlarm } from '@landit/bridge';

import { isAlarmShell } from '@/features/alarm/model/shell-alarm';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

export const useAlarmList = () => {
  const [alarms, setAlarms] = useState<ScheduledAlarm[] | null>(null);

  useEffect(() => {
    if (!isAlarmShell()) return;
    const requestList = () => postToNative({ type: 'GET_ALARM_LIST' });

    // 테스트 예약·다시 걸기처럼 목록을 바꾸는 요청은 ALARM_STATUS로만 답한다 — 그때 목록을 다시 묻는다
    const unsubscribe = subscribeFromNative((message) => {
      if (message.type === 'ALARM_LIST') setAlarms(message.alarms);
      if (message.type === 'ALARM_STATUS') requestList();
    });
    requestList();

    const requery = () => {
      if (document.visibilityState === 'visible') requestList();
    };
    document.addEventListener('visibilitychange', requery);
    return () => {
      document.removeEventListener('visibilitychange', requery);
      unsubscribe();
    };
  }, []);

  return alarms;
};
