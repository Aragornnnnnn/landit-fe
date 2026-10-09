// 반복 알람 — 웹 쪽지(걸기·끄기·오늘 건너뛰기·상태)를 받아 폰 알람으로 옮긴다
import { Platform } from 'react-native';
import {
  alarmTypeSchema,
  repeatingAlarmSchema,
  type AlarmSchedule,
  type AlarmSettingsTarget,
  type AlarmStatus,
  type AlarmType,
  type RepeatingAlarm,
  type RepeatingAlarmState,
} from '@landit/bridge';

import { reportWarning } from '@/monitoring/report';

import {
  AlarmScheduler,
  type AlarmPermissionResponse,
  type AlarmWeekday,
  type ScheduledAlarm,
} from '../../modules/alarm-scheduler';
import { ALARM_LAUNCH_URI } from './alarm-link';

/* 웹 쪽지를 처리하는 함수들. index.tsx가 부른다 */

// 이 종류의 알람을 새 값으로 바꿔 건다 (null이면 끈다)
export const setAlarm = (alarmType: AlarmType, alarm: RepeatingAlarm | null) =>
  inOrder(() => replace(alarmType, alarm, alarm?.skipToday === true));

// 오늘 시나리오를 끝냈으니 이 종류의 오늘 회차만 뺀다
export const skipAlarmToday = (alarmType: AlarmType) =>
  inOrder(async () => {
    const alarms = await alarmsOf(alarmType);
    const now = new Date();
    const hasLaterToday = alarms.some((alarm) =>
      ringsLaterToday(scheduleOf(alarm), now),
    );
    if (hasLaterToday) await rescheduleIfAllowed(alarmType, alarms, true);
  });

// 건너뛴 날이 지났으면 원래대로 되돌린다. 앱이 열리거나 돌아올 때 부른다
export const restoreSkippedDay = () => inOrder(restoreIfSkipPassed);

// 지금 권한과 걸려 있는 알람을 알려 준다
// 앱이 켜진 채 날짜가 바뀌었을 수 있어 지난 건너뛰기를 먼저 되돌리고, 그게 실패해도 상태는 답한다
export const getAlarmStatus = () =>
  inOrder(async () => {
    try {
      await restoreIfSkipPassed();
    } catch (error) {
      reportWarning(error, { step: 'restoreSkippedDay' });
    }
    return toStatus(await AlarmScheduler.getPermissionsAsync());
  });

// iOS는 권한 팝업을 띄우고 답을 기다린다. Android는 설정 화면만 열고 지금 상태를 바로 돌려준다
export const requestAlarmPermission = () =>
  inOrder(async () => toStatus(await AlarmScheduler.requestPermissionsAsync()));

export const openAlarmSettings = async (target: AlarmSettingsTarget) => {
  if (target === 'exactAlarm') await AlarmScheduler.openAlarmSettingsAsync();
  else await AlarmScheduler.openFullScreenIntentSettingsAsync();
};

// "대화하러 가기"로 연 알람의 종류와 갈 화면 — 테스트 알람이거나 이미 지워졌으면 null
export const alarmEntryOf = async (alarmId: string) => {
  const alarms = await AlarmScheduler.getScheduledAlarmsAsync();
  const alarm = alarms.find(({ id }) => id === alarmId);
  const memo = alarm ? readMemo(alarm) : null;
  return memo ? { alarmType: memo.alarmType, path: memo.path } : null;
};

/* 알람 걸기·지우기 */

// 쪽지가 몰려와도 하나씩 차례로 처리한다 (지우고 다시 걸기가 겹치면 알람이 둘 남는다)
let queue: Promise<unknown> = Promise.resolve();
const inOrder = <T>(task: () => Promise<T>) => {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
};

// 이 종류의 알람을 모두 지우고, 새 값이 있고 권한이 되면 다시 건다
const replace = async (
  alarmType: AlarmType,
  alarm: RepeatingAlarm | null,
  skipToday: boolean,
) => {
  for (const { id } of await alarmsOf(alarmType)) {
    await AlarmScheduler.cancelAlarmAsync(id);
  }
  if (!alarm || !(await allowedNow())) return;
  for (const schedule of alarm.schedules) {
    await scheduleOne(alarmType, alarm, schedule, skipToday);
  }
};

// 걸려 있던 알람을 다시 건다. 권한이 없으면 지웠다가 못 거니 아예 건드리지 않는다
const rescheduleIfAllowed = async (
  alarmType: AlarmType,
  alarms: ScheduledAlarm[],
  skipToday: boolean,
) => {
  if (!(await allowedNow())) return;
  await replace(alarmType, toRequest(alarms), skipToday);
};

const restoreIfSkipPassed = async () => {
  const today = localDate(new Date());
  for (const [alarmType, alarms] of await groupByType()) {
    const skipDate = skipDateOf(alarms);
    if (skipDate && skipDate !== today) {
      await rescheduleIfAllowed(alarmType, alarms, false);
    }
  }
};

// 스케줄 하나를 폰 알람 하나로 건다
const scheduleOne = async (
  alarmType: AlarmType,
  { title, path, silent = false }: RepeatingAlarm,
  schedule: AlarmSchedule,
  skipToday: boolean,
) => {
  const now = new Date();
  const timing = skipToday
    ? withoutToday(schedule, now)
    : { weekdays: schedule.weekdays, skipped: false };
  const memo = toMemo({
    alarmType,
    weekdays: schedule.weekdays,
    silent,
    path,
    skipDate: timing.skipped ? localDate(now) : null,
  });
  await AlarmScheduler.scheduleAlarmAsync({
    hour: schedule.hour,
    minute: schedule.minute,
    weekdays: timing.weekdays as AlarmWeekday[],
    timestamp: timing.firstRingAt,
    title,
    ios: iosRingOptions(memo, silent),
    android: androidRingOptions(memo, silent),
  });
};

/* 오늘 회차 빼기. iOS와 Android가 할 수 있는 게 달라 방법이 다르다 */

type RingTiming = {
  weekdays: number[];
  // Android 첫 울림 시각이다 (없으면 요일대로 바로 시작)
  firstRingAt?: number;
  // 오늘 회차를 실제로 뺐는가
  skipped: boolean;
};

const ringsLaterToday = (schedule: AlarmSchedule, now: Date) =>
  schedule.weekdays.includes(weekdayOf(now)) &&
  atTime(now, schedule.hour, schedule.minute) > now;

// 오늘 회차를 뺀 예약 방법을 정한다 (뺄 회차가 없거나 뺄 수 없으면 그대로)
const withoutToday = (schedule: AlarmSchedule, now: Date): RingTiming => {
  const asIs = { weekdays: schedule.weekdays, skipped: false };
  if (!ringsLaterToday(schedule, now)) return asIs;

  // Android는 요일은 그대로 두고 첫 울림만 오늘 다음 회차로 미룬다
  if (Platform.OS === 'android') {
    const firstRingAt = nextRingAt(schedule, endOfDay(now));
    return firstRingAt === null
      ? asIs
      : { weekdays: schedule.weekdays, firstRingAt, skipped: true };
  }

  // iOS는 첫 울림을 정할 수 없어 오늘 요일을 잠깐 뺀다. 요일이 오늘뿐이면 뺄 수 없다
  const otherDays = schedule.weekdays.filter((day) => day !== weekdayOf(now));
  return otherDays.length === 0 ? asIs : { weekdays: otherDays, skipped: true };
};

/* 폰에 걸린 알람 읽기. 알람마다 붙여 둔 메모로 어떤 알람인지 알아본다 */

type AlarmMemo = {
  alarmType: AlarmType;
  // 웹이 고른 요일이다. iOS는 오늘을 건너뛰면 실제 요일에서 오늘을 빼서 따로 적어 둔다
  weekdays: number[];
  silent: boolean;
  // "대화하러 가기"로 열렸을 때 갈 웹 화면
  path: string;
  skipDate: string | null;
};

// 라이브러리 메모는 글자·숫자·참거짓만 받아서 요일을 "1,2,3" 글자로 적는다
const toMemo = ({
  alarmType,
  weekdays,
  silent,
  path,
  skipDate,
}: AlarmMemo) => ({
  alarmType,
  days: weekdays.join(','),
  silent,
  path,
  ...(skipDate ? { skipDate } : {}),
});

const isWeekday = (day: number) =>
  Number.isInteger(day) && day >= 1 && day <= 7;

// 갈 화면 메모가 없거나 앱 밖 주소면 첫 화면으로 보낸다
const pathOf = (memoPath: unknown) => {
  const path = repeatingAlarmSchema.shape.path.safeParse(memoPath);
  return path.success ? path.data : '/';
};

// 반복 알람이면 메모를, 아니면 null을 돌려준다. 요일 메모가 망가졌으면 실제 요일을 쓴다
export const readMemo = (alarm: ScheduledAlarm): AlarmMemo | null => {
  const memo = alarm.metadata ?? {};
  const alarmType = alarmTypeSchema.safeParse(memo.alarmType);
  if (!alarmType.success) return null;
  const days =
    typeof memo.days === 'string'
      ? memo.days.split(',').map(Number).filter(isWeekday)
      : [];
  return {
    alarmType: alarmType.data,
    weekdays: days.length > 0 ? days : [...alarm.weekdays],
    silent: memo.silent === true,
    path: pathOf(memo.path),
    skipDate: typeof memo.skipDate === 'string' ? memo.skipDate : null,
  };
};

const groupByType = async () => {
  const groups = new Map<AlarmType, ScheduledAlarm[]>();
  for (const alarm of await AlarmScheduler.getScheduledAlarmsAsync()) {
    const memo = readMemo(alarm);
    if (!memo) continue;
    groups.set(memo.alarmType, [...(groups.get(memo.alarmType) ?? []), alarm]);
  }
  return groups;
};

const alarmsOf = async (alarmType: AlarmType) =>
  (await groupByType()).get(alarmType) ?? [];

// 웹이 고른 스케줄로 되돌린다 (iOS가 오늘 요일을 뺐어도 원래 요일로)
const scheduleOf = (alarm: ScheduledAlarm): AlarmSchedule => ({
  hour: alarm.hour,
  minute: alarm.minute,
  weekdays: readMemo(alarm)?.weekdays ?? [...alarm.weekdays],
});

const skipDateOf = (alarms: ScheduledAlarm[]) =>
  alarms.map((alarm) => readMemo(alarm)?.skipDate).find(Boolean) ?? null;

// 걸려 있는 알람들을 다시 걸 수 있게 SET_ALARM 요청 모양으로 되돌린다
const toRequest = (alarms: ScheduledAlarm[]): RepeatingAlarm => ({
  title: alarms[0].title,
  schedules: alarms.map(scheduleOf),
  path: readMemo(alarms[0])?.path ?? '/',
  silent: readMemo(alarms[0])?.silent ?? false,
});

const toState = (
  alarmType: AlarmType,
  alarms: ScheduledAlarm[],
): RepeatingAlarmState => ({
  alarmType,
  schedules: alarms.map(scheduleOf),
  path: readMemo(alarms[0])?.path ?? '/',
  skipDate: skipDateOf(alarms),
});

const toStatus = async (
  permission: AlarmPermissionResponse,
): Promise<AlarmStatus> => {
  if (permission.status === 'unavailable') {
    return {
      supported: false,
      permission: 'denied',
      exactAlarm: false,
      fullScreen: false,
      notifications: false,
      repeatingAlarms: [],
    };
  }
  const groups = await groupByType();
  return {
    supported: true,
    permission: toPermissionStatus(permission),
    exactAlarm: permission.canScheduleExactAlarms,
    fullScreen: permission.canUseFullScreenIntent ?? true,
    notifications: permission.canPostNotifications ?? true,
    repeatingAlarms: [...groups].map(([alarmType, alarms]) =>
      toState(alarmType, alarms),
    ),
  };
};

/* 권한 */

// 지금 알람을 걸 수 있는지 본다
// iOS는 허용됐을 때만 건다 (아니면 AlarmKit이 오류를 내거나 그 자리에서 팝업을 띄운다)
// Android는 세 권한이 다 켜져야 건다 — 알림이 꺼지면 화면 없이 소리만 나고,
// 정확한 알람이 꺼지면 시각이 밀리고, 전체 화면 알림이 꺼지면 카드가 고정되지 않아 끌 틈이 없다
export const canSchedule = (permission: AlarmPermissionResponse) => {
  if (permission.status === 'unavailable') return false;
  if (permission.platform === 'android') {
    return (
      permission.canPostNotifications !== false &&
      permission.canScheduleExactAlarms &&
      permission.canUseFullScreenIntent !== false
    );
  }
  return permission.status === 'authorized';
};

const allowedNow = async () =>
  canSchedule(await AlarmScheduler.getPermissionsAsync());

const toPermissionStatus = (
  permission: AlarmPermissionResponse,
): AlarmStatus['permission'] => {
  if (permission.status === 'authorized') return 'granted';
  if (permission.status === 'notDetermined') return 'undetermined';
  return 'denied';
};

/* 울림 화면 옵션 */

type Memo = Record<string, string | boolean>;

export const iosRingOptions = (memo: Memo, silent: boolean) =>
  ({
    secondaryButtonTitle: '대화하러 가기',
    secondaryButtonBehavior: 'openApp',
    stopButtonTitle: '끄기',
    silent,
    metadata: memo,
  }) as const;

export const androidRingOptions = (memo: Memo, silent: boolean) => ({
  ...iosRingOptions(memo, silent),
  // 최대 볼륨으로 고정하지 않고 사용자가 정한 알람 볼륨을 따른다
  enforceVolume: false,
  // 비우면 라이브러리가 영어 "Alarm"을 넣는다
  alertBody: '지금 바로 대화하러 가요',
  // "대화하러 가기"가 이 링크로 앱을 연다 — 셸이 버튼으로 열린 걸 알아채고 갈 화면을 찾는다
  launchUri: ALARM_LAUNCH_URI,
});

/* 날짜 계산 */

const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

// 기기 현지 날짜를 "YYYY-MM-DD"로 적는다
const localDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// 요일 번호를 월=1 … 일=7로 돌려준다
const weekdayOf = (date: Date) => (date.getDay() === 0 ? 7 : date.getDay());

const atTime = (date: Date, hour: number, minute: number) => {
  const at = new Date(date);
  at.setHours(hour, minute, 0, 0);
  return at;
};

const endOfDay = (date: Date) => atTime(date, 23, 59);

// after 이후 이 스케줄이 처음 울리는 시각이다 (일주일 안에 없으면 null)
export const nextRingAt = (schedule: AlarmSchedule, after: Date) => {
  for (let day = 0; day <= 7; day += 1) {
    const date = new Date(after.getTime() + day * DAY_MS);
    const at = atTime(date, schedule.hour, schedule.minute);
    if (at > after && schedule.weekdays.includes(weekdayOf(at))) {
      return at.getTime();
    }
  }
  return null;
};
