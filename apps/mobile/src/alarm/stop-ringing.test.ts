// 울림 끄기 — 플랫폼마다 끄는 방법이 다르고, 울리기 시작하는 순간의 이벤트는 무시한다
import { Platform } from 'react-native';

import {
  AlarmScheduler,
  type AlarmAction,
} from '../../modules/alarm-scheduler';
import {
  onAlarmButtonPressed,
  stopRingingIfOpenedByAlarm,
} from './stop-ringing';

jest.mock('../../modules/alarm-scheduler', () => ({
  AlarmScheduler: {
    getPendingNativeAlarmHandoffAsync: jest.fn(),
    clearPendingNativeAlarmHandoffAsync: jest.fn(),
    completeNativeAlarmAsync: jest.fn(),
    resolveAlarmOccurrenceAsync: jest.fn(),
    addListener: jest.fn(),
  },
}));

const scheduler = jest.mocked(AlarmScheduler);

describe('stopRingingIfOpenedByAlarm', () => {
  const pressed = (action: 'secondaryOpen' | 'nativeStop') => ({
    id: 'h',
    alarmId: 'd',
    occurrenceId: 'o',
    action,
    timestamp: 0,
  });

  it('iOS는 이번 회차만 끝내고 반복 알람은 남긴다 — complete는 AlarmKit 반복 정의까지 지운다', async () => {
    Platform.OS = 'ios';
    scheduler.getPendingNativeAlarmHandoffAsync.mockResolvedValue(
      pressed('secondaryOpen'),
    );

    expect(await stopRingingIfOpenedByAlarm()).toBe(true);
    expect(scheduler.resolveAlarmOccurrenceAsync).toHaveBeenCalledWith('o', {
      outcome: 'completed',
    });
    expect(scheduler.completeNativeAlarmAsync).not.toHaveBeenCalled();
    expect(scheduler.clearPendingNativeAlarmHandoffAsync).toHaveBeenCalled();
  });

  it('Android는 울림 서비스를 끝낸다 — 다음 회차는 라이브러리가 다시 연다', async () => {
    Platform.OS = 'android';
    scheduler.getPendingNativeAlarmHandoffAsync.mockResolvedValue(
      pressed('secondaryOpen'),
    );

    await stopRingingIfOpenedByAlarm();

    expect(scheduler.completeNativeAlarmAsync).toHaveBeenCalledWith('d');
  });

  it('"끄기"로 이미 멈춘 알람이면 기록만 지운다', async () => {
    Platform.OS = 'ios';
    scheduler.getPendingNativeAlarmHandoffAsync.mockResolvedValue(
      pressed('nativeStop'),
    );

    await stopRingingIfOpenedByAlarm();

    expect(scheduler.resolveAlarmOccurrenceAsync).not.toHaveBeenCalled();
    expect(scheduler.completeNativeAlarmAsync).not.toHaveBeenCalled();
    expect(scheduler.clearPendingNativeAlarmHandoffAsync).toHaveBeenCalled();
  });

  it('알람으로 들어온 게 아니면 아무것도 안 한다', async () => {
    scheduler.getPendingNativeAlarmHandoffAsync.mockResolvedValue(null);

    expect(await stopRingingIfOpenedByAlarm()).toBe(false);
    expect(scheduler.completeNativeAlarmAsync).not.toHaveBeenCalled();
  });

  it('iOS 회신에 회차 id가 없으면 끄기를 건너뛴다 — 알람 id로 resolve하면 반복 정의가 지워진다', async () => {
    Platform.OS = 'ios';
    const { occurrenceId: _, ...withoutOccurrence } = pressed('secondaryOpen');
    scheduler.getPendingNativeAlarmHandoffAsync.mockResolvedValue(
      withoutOccurrence,
    );

    await stopRingingIfOpenedByAlarm();

    expect(scheduler.resolveAlarmOccurrenceAsync).not.toHaveBeenCalled();
    expect(scheduler.clearPendingNativeAlarmHandoffAsync).toHaveBeenCalled();
  });

  it('끄기가 실패해도 기록은 지운다 — 남겨 두면 열 때마다 같은 오류가 난다', async () => {
    Platform.OS = 'android';
    scheduler.getPendingNativeAlarmHandoffAsync.mockResolvedValue(
      pressed('secondaryOpen'),
    );
    scheduler.completeNativeAlarmAsync.mockRejectedValue(new Error('gone'));

    await expect(stopRingingIfOpenedByAlarm()).rejects.toThrow('gone');
    expect(scheduler.clearPendingNativeAlarmHandoffAsync).toHaveBeenCalled();
  });
});

describe('onAlarmButtonPressed', () => {
  it('Android가 울리기 시작하며 쏘는 trigger 이벤트는 무시한다 — 받아서 끝내면 울리자마자 꺼진다', () => {
    const onAction = jest.fn();
    onAlarmButtonPressed(onAction);
    const listener = scheduler.addListener.mock.calls[0][1] as (
      action: AlarmAction,
    ) => void;

    listener({
      id: 'h',
      alarmId: 'd',
      action: 'secondaryOpen',
      timestamp: 0,
      trigger: true,
    });
    expect(onAction).not.toHaveBeenCalled();

    listener({ id: 'h2', alarmId: 'd', action: 'secondaryOpen', timestamp: 0 });
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
