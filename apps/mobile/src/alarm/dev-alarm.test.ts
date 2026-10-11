// 개발자 점검용 알람 — 테스트 알람은 반복 알람을 건드리지 않고, 목록은 실제 요일과 다음 울림을 보여 준다
import { Platform } from 'react-native';

import {
  AlarmScheduler,
  type AlarmWeekday,
} from '../../modules/alarm-scheduler';
import { cancelAlarm, listAlarms, scheduleTestAlarm } from './dev-alarm';

jest.mock('../../modules/alarm-scheduler', () => ({
  AlarmScheduler: {
    getPermissionsAsync: jest.fn(),
    getScheduledAlarmsAsync: jest.fn(),
    scheduleAlarmAsync: jest.fn(),
    cancelAlarmAsync: jest.fn(),
  },
}));

const scheduler = jest.mocked(AlarmScheduler);

const androidPermission = {
  platform: 'android' as const,
  status: 'authorized' as const,
  canScheduleExactAlarms: true,
  canOpenSettings: true,
  canUseFullScreenIntent: true,
  canPostNotifications: true,
};

const alarm = (
  id: string,
  metadata: Record<string, string | boolean>,
  extra: { weekdays?: AlarmWeekday[]; timestamp?: number } = {},
) => ({
  id,
  hour: 19,
  minute: 30,
  title: '알람',
  weekdays: [1, 2, 3, 4, 5, 6, 7] as AlarmWeekday[],
  timestamp: 0,
  platform: 'android' as const,
  metadata,
  ...extra,
});

beforeEach(() => {
  jest.resetAllMocks();
  Platform.OS = 'android';
  scheduler.getPermissionsAsync.mockResolvedValue(androidPermission);
  scheduler.getScheduledAlarmsAsync.mockResolvedValue([]);
});

describe('scheduleTestAlarm', () => {
  it('Android에서 알림이 꺼져 있으면 걸지 않는다', async () => {
    scheduler.getPermissionsAsync.mockResolvedValue({
      ...androidPermission,
      canPostNotifications: false,
    });

    await scheduleTestAlarm(60, '테스트');

    expect(scheduler.scheduleAlarmAsync).not.toHaveBeenCalled();
  });

  it('이미 울린 테스트 알람만 지우고 건다 — 반복 알람과 아직 안 울린 테스트 알람은 남긴다', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      alarm('done', { test: true }, { timestamp: 900_000 }),
      alarm('soon', { test: true }, { timestamp: 1_030_000 }),
      alarm('d', { alarmType: 'scenario' }),
    ]);

    await scheduleTestAlarm(60, '테스트');

    expect(scheduler.cancelAlarmAsync.mock.calls).toEqual([['done']]);
    expect(scheduler.scheduleAlarmAsync.mock.calls[0][0]).toMatchObject({
      timestamp: 1_060_000,
      title: '테스트',
    });
  });

  it('iOS는 분 단위로만 걸려 지난 분이면 내일로 밀리니 목표 시각을 다음 분 정각으로 올린다', async () => {
    Platform.OS = 'ios';
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date(2026, 9, 4, 12, 34, 30).getTime());

    await scheduleTestAlarm(10, '테스트');

    expect(scheduler.scheduleAlarmAsync.mock.calls[0][0]).toMatchObject({
      hour: 12,
      minute: 35,
    });
  });
});

describe('listAlarms', () => {
  // 2026-10-07 수요일 10:00
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T10:00:00'));
  });
  afterEach(() => jest.useRealTimers());

  it('반복 알람은 실제 요일을 따라 다음 울림을 계산한다 — 오늘 요일이 빠졌으면 내일', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      alarm(
        'd',
        { alarmType: 'scenario', skipDate: '2026-10-07' },
        { weekdays: [1, 2, 4, 5, 6, 7] },
      ),
    ]);

    expect(await listAlarms()).toEqual([
      {
        id: 'd',
        alarmType: 'scenario',
        hour: 19,
        minute: 30,
        weekdays: [1, 2, 4, 5, 6, 7],
        nextAt: new Date('2026-10-08T19:30:00').getTime(),
        skipDate: '2026-10-07',
      },
    ]);
  });

  it('테스트 알람은 종류 없이 싣고, 이미 울렸으면 다음 울림이 null이다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      alarm(
        'done',
        { test: true },
        { weekdays: [], timestamp: new Date('2026-10-07T09:00:00').getTime() },
      ),
    ]);

    expect(await listAlarms()).toMatchObject([
      { id: 'done', alarmType: null, nextAt: null },
    ]);
  });

  it('랜딧이 건 알람이 아니면 목록에서 뺀다', async () => {
    scheduler.getScheduledAlarmsAsync.mockResolvedValue([
      alarm('other', { kind: 'unknown' }),
    ]);

    expect(await listAlarms()).toEqual([]);
  });
});

describe('cancelAlarm', () => {
  it('고른 알람 하나만 지운다 — 테스트·반복 가리지 않는다', async () => {
    await cancelAlarm('d');

    expect(scheduler.cancelAlarmAsync.mock.calls).toEqual([['d']]);
  });
});
