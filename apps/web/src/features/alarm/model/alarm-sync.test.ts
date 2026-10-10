// 셸 알람 맞추기 — 서버 설정으로 걸려 있어야 할 알람을 정하고, 셸에 걸린 알람과 다르면 다시 건다
import type { AlarmStatus } from '@landit/bridge';
import { describe, expect, it } from 'vitest';

import { alarmTarget, createAlarmDecider, desiredAlarm } from './alarm-sync';

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];
const TODAY = '2026-10-07';

describe('desiredAlarm', () => {
  it('켜져 있으면 매일 그 시각에 울리고 시나리오 홈으로 가는 알람을 만든다', () => {
    expect(desiredAlarm({ time: '07:30', enabled: true })).toEqual({
      title: '오늘의 시나리오 할 시간!',
      schedules: [{ hour: 7, minute: 30, weekdays: EVERY_DAY }],
      path: '/scenario',
    });
  });

  it('꺼져 있으면 알람이 없다', () => {
    expect(desiredAlarm({ time: '07:30', enabled: false })).toBeNull();
  });
});

describe('alarmTarget', () => {
  const base = {
    userId: 60,
    setting: { time: '07:30', enabled: true },
    subscription: { premium: true },
    subscriptionFailed: false,
    isAdmin: false,
    daily: { date: TODAY, scenario: { completed: false } },
    scenarioLoading: false,
    today: TODAY,
  };

  it('유료면 서버 설정대로 걸 알람을 정한다', () => {
    expect(alarmTarget(base)).toEqual({
      desired: desiredAlarm(base.setting),
      doneOn: null,
    });
  });

  it.each([
    ['설정을 아직 모르면', { setting: undefined }],
    ['구독을 아직 모르면', { subscription: null }],
    ['구독 조회가 실패하면', { subscriptionFailed: true }],
    ['오늘 시나리오를 아직 모르면', { scenarioLoading: true }],
  ])('%s 기다린다(wait) — 유료 사용자의 알람을 잘못 끄지 않게', (_, given) => {
    expect(alarmTarget({ ...base, ...given })).toBe('wait');
  });

  it('걸 사람이 아니면 오늘 시나리오가 조회 중이어도 기다리지 않는다 — 조회를 안 해서 계속 조회 중으로 보인다', () => {
    expect(
      alarmTarget({
        ...base,
        subscription: { premium: false },
        scenarioLoading: true,
      }),
    ).toEqual({ desired: null, doneOn: null });
  });

  it('유료가 아니면 알람을 끈다', () => {
    expect(
      alarmTarget({ ...base, subscription: { premium: false } }),
    ).toMatchObject({ desired: null });
  });

  it('ADMIN은 결제하지 않아도 건다 — 결제 없이 실제 흐름을 시험할 수 있게', () => {
    expect(
      alarmTarget({ ...base, subscription: { premium: false }, isAdmin: true }),
    ).toMatchObject({ desired: desiredAlarm(base.setting) });
  });

  it('로그아웃이면 다른 값을 기다리지 않고 끈다 — 다음 사람이 앞 계정의 알람을 받지 않게', () => {
    expect(
      alarmTarget({
        ...base,
        userId: null,
        setting: undefined,
        subscription: null,
      }),
    ).toEqual({ desired: null, doneOn: null });
  });

  it('오늘 시나리오를 끝냈으면 그 날짜를 넘긴다', () => {
    expect(
      alarmTarget({
        ...base,
        daily: { date: TODAY, scenario: { completed: true } },
      }),
    ).toMatchObject({ doneOn: TODAY });
  });

  it('끝낸 날이 기기의 오늘이 아니면 넘기지 않는다 — 앱을 켠 채 자정을 넘기면 새 날 회차를 빼게 된다', () => {
    expect(
      alarmTarget({
        ...base,
        daily: { date: '2026-10-06', scenario: { completed: true } },
      }),
    ).toMatchObject({ doneOn: null });
  });
});

describe('createAlarmDecider', () => {
  const alarm = desiredAlarm({ time: '07:30', enabled: true });
  const later = desiredAlarm({ time: '21:00', enabled: true });

  // 셸 상태 — 시나리오 알람이 걸려 있으면 그 스케줄·갈 화면·건너뛴 날
  const status = (
    scheduled: typeof alarm,
    override: Partial<AlarmStatus> = {},
    skipDate: string | null = null,
  ): AlarmStatus => ({
    supported: true,
    permission: 'granted',
    exactAlarm: true,
    fullScreen: true,
    notifications: true,
    repeatingAlarms: scheduled
      ? [
          {
            alarmType: 'scenario',
            schedules: scheduled.schedules,
            path: scheduled.path,
            skipDate,
          },
        ]
      : [],
    ...override,
  });

  it('걸린 알람이 없으면 건다', () => {
    const decide = createAlarmDecider();

    expect(decide(alarm, status(null), null)).toEqual({
      kind: 'set',
      alarm,
      skipToday: false,
    });
  });

  it('걸린 알람과 같으면 보내지 않는다', () => {
    const decide = createAlarmDecider();

    expect(decide(alarm, status(alarm), null)).toBeNull();
  });

  it('시각이 다르면 다시 건다', () => {
    const decide = createAlarmDecider();

    expect(decide(later, status(alarm), null)).toEqual({
      kind: 'set',
      alarm: later,
      skipToday: false,
    });
  });

  it('갈 화면이 다르면 다시 건다 — 주소를 바꾸면 이미 걸린 알람도 따라간다', () => {
    const decide = createAlarmDecider();
    const old = status({ ...alarm!, path: '/old' });

    expect(decide(alarm, old, null)).toMatchObject({ kind: 'set', alarm });
  });

  it('꺼야 하는데 걸려 있으면 끄라고 보낸다', () => {
    const decide = createAlarmDecider();

    expect(decide(null, status(alarm), null)).toEqual({
      kind: 'set',
      alarm: null,
      skipToday: false,
    });
  });

  it('보낸 직후 답이 여전히 다르면 이번엔 보내지 않는다 — 보내기와 답이 끝없이 반복되지 않게', () => {
    const decide = createAlarmDecider();
    decide(alarm, status(null), null);

    expect(decide(alarm, status(null), null)).toBeNull();
  });

  it('그다음 상태에서도 여전히 다르면 한 번 더 보낸다 — 셸이 걸기에 실패했어도 다시 시도한다', () => {
    const decide = createAlarmDecider();
    decide(alarm, status(null), null);
    decide(alarm, status(null), null);

    expect(decide(alarm, status(null), null)).toMatchObject({
      kind: 'set',
      alarm,
    });
  });

  it('권한이 꺼져 있다 켜지면 한 번 다시 보낸다 — 꺼진 동안 보낸 요청은 셸이 걸지 않았다', () => {
    const decide = createAlarmDecider();
    decide(alarm, status(null, { fullScreen: false }), null);

    expect(decide(alarm, status(null), null)).toMatchObject({
      kind: 'set',
      alarm,
    });
  });

  it('권한을 아직 묻지 않았으면 걸지 않는다 — iOS는 거는 순간 권한 팝업이 떠서 엉뚱한 화면에서 묻게 된다', () => {
    const decide = createAlarmDecider();

    expect(
      decide(alarm, status(null, { permission: 'undetermined' }), null),
    ).toBeNull();
  });

  it('권한을 묻지 않았어도 끄는 건 보낸다', () => {
    const decide = createAlarmDecider();

    expect(
      decide(null, status(alarm, { permission: 'undetermined' }), null),
    ).toMatchObject({ kind: 'set', alarm: null });
  });

  it('알람을 못 쓰는 기기면 아무것도 보내지 않는다', () => {
    const decide = createAlarmDecider();

    expect(decide(alarm, status(null, { supported: false }), null)).toBeNull();
  });

  describe('오늘 시나리오를 끝낸 날', () => {
    it('걸린 알람이 맞고 아직 안 건너뛰었으면 오늘 건너뛰기를 보낸다', () => {
      const decide = createAlarmDecider();

      expect(decide(alarm, status(alarm), TODAY)).toEqual({ kind: 'skip' });
    });

    it('이미 오늘 건너뛰었으면 보내지 않는다', () => {
      const decide = createAlarmDecider();

      expect(decide(alarm, status(alarm, {}, TODAY), TODAY)).toBeNull();
    });

    it('보낸 직후 답에 건너뛴 날이 없어도 이번엔 보내지 않는다 — 울릴 시각이 지난 날 끝없이 보내지 않게', () => {
      const decide = createAlarmDecider();
      decide(alarm, status(alarm), TODAY);

      expect(decide(alarm, status(alarm), TODAY)).toBeNull();
    });

    it('그다음 상태에서도 건너뛴 날이 없으면 한 번 더 보낸다 — 권한이 꺼져 셸이 못 했어도 다시 시도한다', () => {
      const decide = createAlarmDecider();
      decide(alarm, status(alarm), TODAY);
      decide(alarm, status(alarm), TODAY);

      expect(decide(alarm, status(alarm), TODAY)).toEqual({ kind: 'skip' });
    });

    it('다시 걸어야 하면 처음부터 오늘 회차를 빼고 건다 — 걸고 나서 건너뛰면 그 사이 틈이 생긴다', () => {
      const decide = createAlarmDecider();

      expect(decide(later, status(alarm), TODAY)).toEqual({
        kind: 'set',
        alarm: later,
        skipToday: true,
      });
    });

    it('오늘 안 했으면 건너뛰지 않는다', () => {
      const decide = createAlarmDecider();

      expect(decide(alarm, status(alarm), null)).toBeNull();
    });

    it('알람이 꺼져 있으면 건너뛸 것도 없다', () => {
      const decide = createAlarmDecider();

      expect(decide(null, status(null), TODAY)).toBeNull();
    });
  });
});
