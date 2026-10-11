'use client';

// 셸의 시나리오 알람을 서버 설정과 맞추는 무렌더 컴포넌트 — 루트 레이아웃에 둔다.
// 판단은 alarm-sync.ts의 규칙이 하고, 여기서는 값을 모아 넘기고 결과를 셸에 보내기만 한다
import { useEffect, useState } from 'react';

// 알람은 유료 전용이고 오늘의 시나리오를 끝낸 날은 울리지 않아서 구독·오늘 시나리오 상태를 함께 읽는다
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { useAuthStore } from '@/shared/auth/auth-store';
import { postToNative } from '@/shared/bridge/web-bridge';
import { getDeviceToday } from '@/shared/lib/device-today';

import {
  alarmTarget,
  createAlarmDecider,
  wantsAlarm,
} from '../model/alarm-sync';
import { ALARM_TYPE } from '../model/shell-alarm';
import { useAlarmSettingQuery } from '../model/useAlarmSettingQuery';
import { useAlarmStatus } from '../model/useAlarmStatus';

export const AlarmSync = () => {
  const status = useAlarmStatus();
  const { data: setting } = useAlarmSettingQuery();
  const { subscription, isError: subscriptionFailed } = useSubscriptionQuery();
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');
  // 오늘 끝냈는지는 알람을 걸 사람만 조회한다 — 느린 조회라 모든 화면에서 부르지 않는다
  const wanted =
    status !== null && wantsAlarm({ setting, subscription, isAdmin });
  const { daily, isLoading } = useDailyScenarioQuery(undefined, {
    enabled: wanted,
  });
  const [decide] = useState(createAlarmDecider);

  // 값이 바뀔 때만 판단한다. 기기의 오늘도 이때 구한다
  useEffect(() => {
    if (!status) return;
    const target = alarmTarget({
      userId,
      setting,
      subscription,
      subscriptionFailed,
      isAdmin,
      daily,
      scenarioLoading: isLoading,
      today: getDeviceToday(),
    });
    if (target === 'wait') return;
    const command = decide(target.desired, status, target.doneOn);
    if (!command) return;
    if (command.kind === 'skip') {
      postToNative({ type: 'SKIP_ALARM_TODAY', alarmType: ALARM_TYPE });
      return;
    }
    postToNative({
      type: 'SET_ALARM',
      alarmType: ALARM_TYPE,
      alarm: command.alarm && {
        ...command.alarm,
        skipToday: command.skipToday,
      },
    });
  }, [
    status,
    userId,
    setting,
    subscription,
    subscriptionFailed,
    isAdmin,
    daily,
    isLoading,
    decide,
  ]);

  return null;
};
