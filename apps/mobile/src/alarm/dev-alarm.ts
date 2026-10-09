// 개발자 점검용 알람 — 몇 초 뒤 한 번 울리는 테스트 알람, 폰에 걸린 알람 목록, 하나씩 지우기
import { Platform } from 'react-native';
import type { ScheduledAlarm as AlarmListItem } from '@landit/bridge';

import {
  AlarmScheduler,
  type ScheduledAlarm,
} from '../../modules/alarm-scheduler';
import {
  androidRingOptions,
  canSchedule,
  iosRingOptions,
  nextRingAt,
  readMemo,
} from './alarm';

// 반복 알람과 구분하려고 테스트 알람에는 이 메모만 붙인다
const TEST_MEMO = { test: true } as const;

const isTestAlarm = (alarm: ScheduledAlarm) => alarm.metadata?.test === true;

export const scheduleTestAlarm = async (
  delaySeconds: number,
  title: string,
  { silent = false }: { silent?: boolean } = {},
) => {
  if (!canSchedule(await AlarmScheduler.getPermissionsAsync())) return;
  // 이미 울린 테스트 알람은 지운다 (1회 알람도 기록이 남아 목록에 쌓인다)
  for (const alarm of await AlarmScheduler.getScheduledAlarmsAsync()) {
    if (isTestAlarm(alarm) && alarm.timestamp <= Date.now()) {
      await AlarmScheduler.cancelAlarmAsync(alarm.id);
    }
  }
  const at = new Date(Date.now() + delaySeconds * 1000);
  // iOS는 초를 무시하고 시·분으로만 건다. 이미 지난 분이면 내일로 밀리니 다음 분 정각으로 올린다
  if (Platform.OS === 'ios' && at.getSeconds() > 0) {
    at.setMinutes(at.getMinutes() + 1, 0, 0);
  }
  await AlarmScheduler.scheduleAlarmAsync({
    hour: at.getHours(),
    minute: at.getMinutes(),
    timestamp: at.getTime(),
    title,
    ios: iosRingOptions(TEST_MEMO, silent),
    android: androidRingOptions(TEST_MEMO, silent),
  });
};

// 목록에서 고른 알람 하나를 지운다 — 쌓인 테스트 알람이나 반복 알람을 하나씩 치울 때
export const cancelAlarm = (id: string) => AlarmScheduler.cancelAlarmAsync(id);

// 반복 알람은 요일로, 1회 알람은 걸어 둔 시각으로 다음 울림을 구한다
const nextAtOf = (alarm: ScheduledAlarm, now: Date) => {
  if (alarm.weekdays.length > 0) return nextRingAt(alarm, now);
  return alarm.timestamp > now.getTime() ? alarm.timestamp : null;
};

// 폰에 걸린 반복·테스트 알람 전부를 실제 요일과 다음 울림 시각과 함께 돌려준다
export const listAlarms = async (): Promise<AlarmListItem[]> => {
  const now = new Date();
  return (await AlarmScheduler.getScheduledAlarmsAsync()).flatMap((alarm) => {
    const memo = readMemo(alarm);
    if (!memo && !isTestAlarm(alarm)) return [];
    return [
      {
        id: alarm.id,
        alarmType: memo?.alarmType ?? null,
        hour: alarm.hour,
        minute: alarm.minute,
        weekdays: alarm.weekdays,
        nextAt: nextAtOf(alarm, now),
        skipDate: memo?.skipDate ?? null,
      },
    ];
  });
};
