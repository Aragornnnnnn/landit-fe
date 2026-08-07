// 리마인더 동기화 검증 — 리마인더 표식이 붙은 알림만 걷어내고 미래 시각만 재예약하는 계약
import * as Notifications from 'expo-notifications';

import { REMINDER_CHANNEL_ID } from './reminder-schedule';
import { syncReminders } from './reminders';

jest.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getPresentedNotificationsAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const mocked = Notifications as jest.Mocked<typeof Notifications>;

// 미래 시각 리마인더 하나 — 개별 테스트가 필요에 따라 덮어쓴다
const futureReminder = {
  notifyAt: '2099-01-01T20:00:00+09:00',
  title: '오늘의 시나리오',
  body: '카페에서 주문하기가 기다리고 있어요',
  url: '/scenario',
};

beforeEach(() => {
  mocked.getAllScheduledNotificationsAsync.mockResolvedValue([]);
  mocked.getPresentedNotificationsAsync.mockResolvedValue([]);
});

describe('syncReminders', () => {
  it('예약 목록에서 리마인더 표식이 붙은 것만 취소한다', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'ours',
        content: { data: { kind: 'daily-reminder' } },
      },
      {
        identifier: 'someone-elses',
        content: { data: { kind: 'marketing' } },
      },
      {
        identifier: 'no-data',
        content: {},
      },
    ] as never);

    await syncReminders([]);

    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'ours',
    );
  });

  it('알림 센터에 남은 것도 리마인더 표식만 치운다', async () => {
    mocked.getPresentedNotificationsAsync.mockResolvedValue([
      {
        request: {
          identifier: 'ours',
          content: { data: { kind: 'daily-reminder' } },
        },
      },
      {
        request: {
          identifier: 'someone-elses',
          content: { data: { kind: 'marketing' } },
        },
      },
    ] as never);

    await syncReminders([]);

    expect(mocked.dismissNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mocked.dismissNotificationAsync).toHaveBeenCalledWith('ours');
  });

  // 트리거에 채널을 지정하지 않으면 안드로이드가 우리가 만든 채널 대신
  // expo 폴백 채널로 게시한다 — 알림 설정에 우리가 지은 이름이 안 나온다
  it('미래 시각 리마인더를 표식·경로·채널을 담아 DATE 트리거로 예약한다', async () => {
    await syncReminders([futureReminder]);

    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: futureReminder.title,
        body: futureReminder.body,
        data: { kind: 'daily-reminder', url: '/scenario' },
      },
      trigger: {
        type: 'date',
        date: new Date(futureReminder.notifyAt),
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  });

  it('지난 시각 리마인더는 예약하지 않는다', async () => {
    await syncReminders([
      { ...futureReminder, notifyAt: '2020-01-01T20:00:00+09:00' },
    ]);

    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
