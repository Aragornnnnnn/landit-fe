// 반복 알람 — 웹 쪽지를 받아 그 종류의 알람만 지우고 다시 걸며, 권한·건너뛰기·되돌리기를 지킨다
import { Platform } from 'react-native';

import { reportWarning } from '@/monitoring/report';

import {
  AlarmScheduler,
  type AlarmWeekday,
} from '../../modules/alarm-scheduler';
import {
  alarmEntryOf,
  getAlarmStatus,
  restoreSkippedDay,
  setAlarm,
  skipAlarmToday,
} from './alarm';

jest.mock('../../modules/alarm-scheduler', () => ({
  AlarmScheduler: {
    getPermissionsAsync: jest.fn(),
    getScheduledAlarmsAsync: jest.fn(),
    scheduleAlarmAsync: jest.fn(),
    cancelAlarmAsync: jest.fn(),
  },
}));
jest.mock('@/monitoring/report', () => ({ reportWarning: jest.fn() }));

const scheduler = jest.mocked(AlarmScheduler);

const androidPermission = {
  platform: 'android' as const,
  status: 'authorized' as const,
  canScheduleExactAlarms: true,
  canOpenSettings: true,
  canUseFullScreenIntent: true,
  canPostNotifications: true,
};
const iosDenied = {
  ...androidPermission,
  platform: 'ios' as const,
  status: 'denied' as const,
};

const EVERY_DAY: AlarmWeekday[] = [1, 2, 3, 4, 5, 6, 7];
const TITLE = '오늘의 시나리오 할 시간!';
const PATH = '/scenario';

const everyDayAt = (hour: number) => ({
  title: TITLE,
  schedules: [{ hour, minute: 30, weekdays: EVERY_DAY }],
  path: PATH,
});

// 폰에 걸려 있는 시나리오 알람 하나 — 앱이 남기는 메모 모양 그대로
const scenario = (
  id: string,
  {
    hour = 19,
    weekdays = EVERY_DAY,
    memo = {},
  }: {
    hour?: number;
    weekdays?: AlarmWeekday[];
    memo?: Record<string, string | boolean>;
  } = {},
) => ({
  id,
  hour,
  minute: 30,
  title: TITLE,
  weekdays,
  timestamp: 0,
  platform: 'android' as const,
  metadata: {
    alarmType: 'scenario',
    days: EVERY_DAY.join(','),
    silent: false,
    path: PATH,
    ...memo,
  },
});

const testAlarm = (id: string) => ({
  ...scenario(id),
  metadata: { test: true },
});

const scheduled = (call = 0) =>
  scheduler.scheduleAlarmAsync.mock.calls[call][0];

beforeEach(() => {
  // reset은 앞 테스트가 심은 응답까지 되돌린다 (clear는 호출 기록만 지운다)
  jest.resetAllMocks();
  Platform.OS = 'android';
  scheduler.getPermissionsAsync.mockResolvedValue(androidPermission);
  scheduler.getScheduledAlarmsAsync.mockResolvedValue([]);
});
afterEach(() => jest.useRealTimers());

describe('getAlarmStatus', () => {
  it('알람을 못 쓰는 기기는 supported=false로 알린다', async () => {
    scheduler.getPermissionsAsync.mockResolvedValue({
      ...androidPermission,
      platform: 'ios',
      status: 'unavailable',
    });

    expect(await getAlarmStatus()).toEqual({
      supported: false,
      permission: 'denied',
      exactAlarm: false,
      fullScreen: false,
      notifications: false,
      repeatingAlarms: [],
    });
  });

  it('반복 알람을 종류별로 묶어 웹이 고른 요일로 알린다 — 테스트 알람은 뺀다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T10:00:00'));
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      testAlarm('t'),
      // iOS가 오늘(수)을 빼서 실제 요일은 6개지만 웹이 고른 요일은 7개다
      scenario('d', {
        weekdays: [1, 2, 4, 5, 6, 7],
        memo: { skipDate: '2026-10-07' },
      }),
    ]);

    expect((await getAlarmStatus()).repeatingAlarms).toEqual([
      {
        alarmType: 'scenario',
        schedules: [{ hour: 19, minute: 30, weekdays: EVERY_DAY }],
        path: PATH,
        skipDate: '2026-10-07',
      },
    ]);
  });

  it('지우고 다시 거는 중에 물으면 다 건 뒤의 상태로 답한다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('d', { hour: 7 }),
    ]);
    let finishCancel: () => void = () => undefined;
    scheduler.cancelAlarmAsync.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishCancel = () => resolve(true);
      }),
    );

    const applying = setAlarm('scenario', everyDayAt(8));
    const status = getAlarmStatus();
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('n', { hour: 8 }),
    ]);
    finishCancel();
    await applying;

    expect((await status).repeatingAlarms[0].schedules[0].hour).toBe(8);
  });

  it('지난 건너뛰기를 되돌리다 실패해도 상태는 답한다 — 웹이 답장을 못 받으면 멈춘다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T09:00:00'));
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('d', { memo: { skipDate: '2026-10-07' } }),
    ]);
    scheduler.cancelAlarmAsync.mockRejectedValue(new Error('native'));

    expect((await getAlarmStatus()).supported).toBe(true);
    expect(reportWarning).toHaveBeenCalled();
  });
});

describe('setAlarm', () => {
  it('같은 종류의 알람만 지우고 다시 건다 — 테스트 알람은 남긴다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('old-1'),
      scenario('old-2'),
      testAlarm('t'),
    ]);

    await setAlarm('scenario', everyDayAt(7));

    expect(scheduler.cancelAlarmAsync.mock.calls).toEqual([
      ['old-1'],
      ['old-2'],
    ]);
    expect(scheduled()).toMatchObject({
      hour: 7,
      minute: 30,
      weekdays: EVERY_DAY,
      title: TITLE,
      android: { metadata: { alarmType: 'scenario', days: '1,2,3,4,5,6,7' } },
    });
  });

  it('눌렀을 때 갈 화면을 메모에 적고, Android는 버튼이 알람 링크로 앱을 열게 한다', async () => {
    await setAlarm('scenario', {
      ...everyDayAt(7),
      path: '/scenario?from=alarm',
    });

    expect(scheduled()).toMatchObject({
      ios: { metadata: { path: '/scenario?from=alarm' } },
      android: {
        metadata: { path: '/scenario?from=alarm' },
        launchUri: 'landit://alarm?alarmId={alarmId}',
      },
    });
  });

  it('스케줄이 여러 개면 스케줄마다 알람을 하나씩 건다', async () => {
    await setAlarm('scenario', {
      title: TITLE,
      path: PATH,
      schedules: [
        { hour: 7, minute: 0, weekdays: [1, 2, 3, 4, 5] },
        { hour: 10, minute: 30, weekdays: [6, 7] },
      ],
    });

    expect(scheduler.scheduleAlarmAsync).toHaveBeenCalledTimes(2);
    expect(scheduled(1)).toMatchObject({ hour: 10, weekdays: [6, 7] });
  });

  it('소리 없이 고르면 iOS·Android 둘 다 소리 없이 건다', async () => {
    await setAlarm('scenario', { ...everyDayAt(7), silent: true });

    expect(scheduled()).toMatchObject({
      ios: { silent: true },
      android: { silent: true },
    });
  });

  it('null이면 지우기만 한다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([scenario('old')]);

    await setAlarm('scenario', null);

    expect(scheduler.cancelAlarmAsync).toHaveBeenCalledWith('old');
    expect(scheduler.scheduleAlarmAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['iOS 알람 권한이 없으면', iosDenied],
    [
      'Android 알림이 꺼져 있으면',
      { ...androidPermission, canPostNotifications: false },
    ],
    // 꺼진 채 걸면 시각이 몇 분씩 밀리거나, 위쪽 카드가 고정되지 않고 사라져 끌 틈이 없다
    [
      'Android 정확한 알람이 꺼져 있으면',
      { ...androidPermission, canScheduleExactAlarms: false },
    ],
    [
      'Android 전체 화면 알림이 꺼져 있으면',
      { ...androidPermission, canUseFullScreenIntent: false },
    ],
  ])('%s 걸지 않는다', async (_, permission) => {
    scheduler.getPermissionsAsync.mockResolvedValue(permission);

    await setAlarm('scenario', everyDayAt(7));

    expect(scheduler.scheduleAlarmAsync).not.toHaveBeenCalled();
  });

  it('Android는 세 권한이 다 켜져 있으면 건다 — 라이브러리 status가 denied여도 상관없다', async () => {
    scheduler.getPermissionsAsync.mockResolvedValue({
      ...androidPermission,
      status: 'denied',
    });

    await setAlarm('scenario', everyDayAt(7));

    expect(scheduler.scheduleAlarmAsync).toHaveBeenCalledTimes(1);
  });

  it('연달아 바꾸면 차례로 적용해 마지막 값 하나만 남는다', async () => {
    const live: ReturnType<typeof scenario>[] = [];
    scheduler.getScheduledAlarmsAsync.mockImplementation(async () => [...live]);
    scheduler.cancelAlarmAsync.mockImplementation(async (id) => {
      live.splice(
        live.findIndex((alarm) => alarm.id === id),
        1,
      );
      return true;
    });
    scheduler.scheduleAlarmAsync.mockImplementation(async (input) => {
      const alarm = scenario(`id-${input.hour}`, { hour: input.hour });
      live.push(alarm);
      return alarm;
    });

    await Promise.all([
      setAlarm('scenario', everyDayAt(7)),
      setAlarm('scenario', everyDayAt(8)),
    ]);

    expect(live.map((alarm) => alarm.hour)).toEqual([8]);
  });

  it('skipToday를 실으면 오늘 회차를 빼고 걸고 건너뛴 날을 적는다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T10:00:00'));

    await setAlarm('scenario', { ...everyDayAt(21), skipToday: true });

    expect(scheduled()).toMatchObject({
      timestamp: new Date('2026-10-08T21:30:00').getTime(),
      android: { metadata: { skipDate: '2026-10-07' } },
    });
  });

  it('skipToday를 실어도 오늘 회차가 이미 지났으면 그대로 걸고 건너뛴 날을 안 적는다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T22:00:00'));

    await setAlarm('scenario', { ...everyDayAt(21), skipToday: true });

    expect(scheduled().timestamp).toBeUndefined();
    expect(scheduled().android?.metadata).not.toHaveProperty('skipDate');
  });
});

describe('skipAlarmToday', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T10:00:00'));
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([scenario('d')]);
  });

  it('걸려 있던 값 그대로 오늘 회차만 빼서 다시 건다 — 소리 없음 설정도 지킨다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('d', { memo: { silent: true } }),
    ]);

    await skipAlarmToday('scenario');

    expect(scheduler.cancelAlarmAsync).toHaveBeenCalledWith('d');
    expect(scheduled()).toMatchObject({
      hour: 19,
      title: TITLE,
      timestamp: new Date('2026-10-08T19:30:00').getTime(),
      android: {
        silent: true,
        metadata: { skipDate: '2026-10-07', path: PATH },
      },
    });
  });

  it.each([
    ['오늘 울릴 회차가 이미 지났으면', '2026-10-07T20:00:00', [scenario('d')]],
    ['이 종류의 알람이 없으면', '2026-10-07T10:00:00', []],
  ])('%s 아무것도 안 한다', async (_, now, alarms) => {
    jest.setSystemTime(new Date(now));
    scheduler.getScheduledAlarmsAsync.mockResolvedValue(alarms);

    await skipAlarmToday('scenario');

    expect(scheduler.cancelAlarmAsync).not.toHaveBeenCalled();
    expect(scheduler.scheduleAlarmAsync).not.toHaveBeenCalled();
  });

  it('권한이 없으면 지우지 않는다 — 지웠다가 다시 못 걸면 알람이 사라진다', async () => {
    scheduler.getPermissionsAsync.mockResolvedValue(iosDenied);

    await skipAlarmToday('scenario');

    expect(scheduler.cancelAlarmAsync).not.toHaveBeenCalled();
  });
});

describe('restoreSkippedDay', () => {
  const skippedYesterday = () =>
    scenario('d', {
      weekdays: [1, 2, 4, 5, 6, 7],
      memo: { skipDate: '2026-10-07' },
    });

  it('건너뛴 날이 지났으면 원래 요일로 다시 걸고 건너뛴 기록을 지운다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T09:00:00'));
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([skippedYesterday()]);

    await restoreSkippedDay();

    expect(scheduler.cancelAlarmAsync).toHaveBeenCalledWith('d');
    expect(scheduled().weekdays).toEqual(EVERY_DAY);
    expect(scheduled().ios?.metadata).not.toHaveProperty('skipDate');
  });

  it('건너뛴 날이 아직 오늘이면 그대로 둔다', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T15:00:00'));
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([skippedYesterday()]);

    await restoreSkippedDay();

    expect(scheduler.cancelAlarmAsync).not.toHaveBeenCalled();
  });

  it('권한이 없으면 지우지 않는다 — 권한을 다시 켜면 그대로 울리게', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T09:00:00'));
    scheduler.getPermissionsAsync.mockResolvedValue(iosDenied);
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([skippedYesterday()]);

    await restoreSkippedDay();

    expect(scheduler.cancelAlarmAsync).not.toHaveBeenCalled();
  });
});

describe('여러 경우의 오늘 건너뛰기 — 2026-10-07(수) 오전 10시', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T10:00:00'));
  });
  const skipWith = (weekdays: AlarmWeekday[]) =>
    setAlarm('scenario', {
      title: TITLE,
      schedules: [{ hour: 19, minute: 30, weekdays }],
      path: PATH,
      skipToday: true,
    });

  it('iOS는 오늘 요일을 뺀다 — 첫 울림 시각을 정할 수 없다', async () => {
    Platform.OS = 'ios';

    await skipWith(EVERY_DAY);

    expect(scheduled().weekdays).toEqual([1, 2, 4, 5, 6, 7]);
  });

  it('iOS에서 요일이 오늘뿐이면 뺄 수 없어 그대로 걸고 건너뛴 날을 안 적는다', async () => {
    Platform.OS = 'ios';

    await skipWith([3]);

    expect(scheduled().weekdays).toEqual([3]);
    expect(scheduled().ios?.metadata).not.toHaveProperty('skipDate');
  });

  it('Android에서 내일 요일이 없으면 다음 요일로 첫 울림을 미룬다', async () => {
    await skipWith([1, 3]);

    expect(scheduled().timestamp).toBe(
      new Date('2026-10-12T19:30:00').getTime(),
    );
  });

  it('오늘 요일이 없는 스케줄은 그대로 건다', async () => {
    await skipWith([6, 7]);

    expect(scheduled().timestamp).toBeUndefined();
    expect(scheduled().android?.metadata).not.toHaveProperty('skipDate');
  });
});

describe('폰에 걸린 알람 읽기', () => {
  it('요일 메모가 망가졌으면 실제 걸린 요일로 알린다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('d', { weekdays: [1, 2, 4], memo: { days: 'x,9' } }),
    ]);

    expect(
      (await getAlarmStatus()).repeatingAlarms[0].schedules[0].weekdays,
    ).toEqual([1, 2, 4]);
  });

  it('갈 화면 메모가 없거나 앱 밖 주소면 첫 화면(/)으로 알린다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('d', { memo: { path: 'https://example.com' } }),
    ]);

    expect((await getAlarmStatus()).repeatingAlarms[0].path).toBe('/');
  });
});

describe('alarmEntryOf', () => {
  it('버튼으로 연 알람의 종류와 갈 화면을 찾는다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      scenario('d', { memo: { path: '/scenario?from=alarm' } }),
    ]);

    expect(await alarmEntryOf('d')).toEqual({
      alarmType: 'scenario',
      path: '/scenario?from=alarm',
    });
  });

  it.each([
    ['테스트 알람', [testAlarm('d')]],
    ['이미 지워진 알람', []],
  ])('%s이면 null이다 — 갈 화면이 없다', async (_, alarms) => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue(alarms);

    expect(await alarmEntryOf('d')).toBeNull();
  });
});
