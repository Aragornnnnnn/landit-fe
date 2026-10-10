// AlarmSync — 유료 여부·서버 설정·오늘 완료 여부로 셸의 시나리오 알람을 맞춘다
import type { AlarmStatus } from '@landit/bridge';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { useAuthStore } from '@/shared/auth/auth-store';
import { postToNative } from '@/shared/bridge/web-bridge';

import { useAlarmSettingQuery } from '../model/useAlarmSettingQuery';
import { useAlarmStatus } from '../model/useAlarmStatus';
import { AlarmSync } from './AlarmSync';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
}));
const postToNativeMock = vi.mocked(postToNative);

vi.mock('@/shared/auth/auth-store');
vi.mock('@/features/scenario/model/useDailyScenarioQuery');
vi.mock('@/features/subscription/model/my-subscription/useSubscriptionQuery');
vi.mock('../model/useAlarmSettingQuery');
vi.mock('../model/useAlarmStatus');

const SEVEN_THIRTY = {
  title: '오늘의 시나리오 할 시간!',
  schedules: [{ hour: 7, minute: 30, weekdays: [1, 2, 3, 4, 5, 6, 7] }],
  path: '/scenario',
};

// 셸 상태 — scheduled면 7:30 시나리오 알람이 걸려 있다
const shell = ({ scheduled = false } = {}): AlarmStatus => ({
  supported: true,
  permission: 'granted',
  exactAlarm: true,
  fullScreen: true,
  notifications: true,
  repeatingAlarms: scheduled
    ? [
        {
          alarmType: 'scenario',
          schedules: SEVEN_THIRTY.schedules,
          path: SEVEN_THIRTY.path,
          skipDate: null,
        },
      ]
    : [],
});

const arrange = ({
  status = shell(),
  premium = true as boolean | null,
  subscriptionError = false,
  scenarioDone = false,
  scenarioLoading = false,
  role = 'USER' as 'USER' | 'ADMIN',
} = {}) => {
  vi.mocked(useAuthStore).mockImplementation(((
    select: (state: { member: { userId: number; role: string } }) => unknown,
  ) => select({ member: { userId: 60, role } })) as never);
  vi.mocked(useAlarmStatus).mockReturnValue(status);
  vi.mocked(useAlarmSettingQuery).mockReturnValue({
    data: { time: '07:30', enabled: true },
  } as never);
  vi.mocked(useSubscriptionQuery).mockReturnValue({
    subscription: premium === null ? null : ({ premium } as never),
    isPending: premium === null && !subscriptionError,
    isError: subscriptionError,
  });
  vi.mocked(useDailyScenarioQuery).mockReturnValue({
    daily: {
      date: '2026-10-07',
      playable: true,
      scenario: { completed: scenarioDone } as never,
    },
    error: null,
    isLoading: scenarioLoading,
    retry: () => undefined,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  // 기기의 오늘 = 2026-10-07 (daily.date와 같은 날)
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AlarmSync', () => {
  it('유료면 서버 설정 시각으로 매일 알람을 건다', () => {
    arrange();

    render(<AlarmSync />);

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'SET_ALARM',
      alarmType: 'scenario',
      alarm: { ...SEVEN_THIRTY, skipToday: false },
    });
  });

  it('유료가 아니면 걸려 있던 알람을 끈다 — 구독이 끝나면 다음 실행 때 꺼진다', () => {
    arrange({
      premium: false,
      status: shell({ scheduled: true }),
    });

    render(<AlarmSync />);

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'SET_ALARM',
      alarmType: 'scenario',
      alarm: null,
    });
  });

  it('ADMIN은 결제하지 않아도 알람을 건다 — 개발자가 결제 없이 실제 흐름을 시험할 수 있게', () => {
    arrange({ premium: false, role: 'ADMIN' });

    render(<AlarmSync />);

    expect(postToNativeMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_ALARM', alarm: expect.anything() }),
    );
  });

  it.each([
    ['구독을 아직 모르면', { premium: null }],
    ['구독 조회가 실패하면', { premium: null, subscriptionError: true }],
  ])(
    '%s 아무것도 보내지 않는다 — 유료 사용자의 알람을 잘못 끄면 안 된다',
    (_, given) => {
      arrange({
        ...given,
        status: shell({ scheduled: true }),
      });

      render(<AlarmSync />);

      expect(postToNativeMock).not.toHaveBeenCalled();
    },
  );

  it('오늘 시나리오를 끝냈고 알람이 걸려 있으면 오늘 회차를 건너뛴다', () => {
    arrange({
      scenarioDone: true,
      status: shell({ scheduled: true }),
    });

    render(<AlarmSync />);

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'SKIP_ALARM_TODAY',
      alarmType: 'scenario',
    });
  });

  it('오늘 시나리오를 안 끝냈으면 건너뛰지 않는다 — 스몰톡만 한 날도 알람은 울린다', () => {
    arrange({
      scenarioDone: false,
      status: shell({ scheduled: true }),
    });

    render(<AlarmSync />);

    expect(postToNativeMock).not.toHaveBeenCalled();
  });

  it('오늘 시나리오를 아직 모르면 걸지 않고 기다린다 — 끝낸 날인지 알고 나서 건다', () => {
    arrange({ scenarioLoading: true });

    render(<AlarmSync />);

    expect(postToNativeMock).not.toHaveBeenCalled();
  });

  it('오늘 시나리오를 끝낸 날 처음 걸 때는 오늘 회차를 빼고 건다', () => {
    arrange({ scenarioDone: true });

    render(<AlarmSync />);

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'SET_ALARM',
      alarmType: 'scenario',
      alarm: { ...SEVEN_THIRTY, skipToday: true },
    });
  });

  it('알람을 걸 사람이 아니면 오늘의 시나리오를 조회하지 않는다 — 모든 화면에서 느린 조회가 나가지 않게', () => {
    arrange({ premium: false });

    render(<AlarmSync />);

    expect(useDailyScenarioQuery).toHaveBeenCalledWith(undefined, {
      enabled: false,
    });
  });
});
