// 알람 권한 — 셸 상태에서 무엇이 막혀 알람이 안 울리는지 플랫폼별로 가른다
import type { AlarmStatus } from '@landit/bridge';
import { describe, expect, it } from 'vitest';

import {
  alarmBlocker,
  setupPermissionStep,
  unblockAction,
} from './alarm-permission';

const status = (patch: Partial<AlarmStatus> = {}): AlarmStatus => ({
  supported: true,
  permission: 'granted',
  exactAlarm: true,
  fullScreen: true,
  notifications: true,
  repeatingAlarms: [],
  ...patch,
});

describe('alarmBlocker — iOS', () => {
  it('허용했으면 막힌 게 없다', () => {
    expect(alarmBlocker(status(), 'ios')).toBeNull();
  });

  it('아직 묻지 않았으면 팝업으로 물을 수 있다', () => {
    expect(alarmBlocker(status({ permission: 'undetermined' }), 'ios')).toBe(
      'ios-ask',
    );
  });

  it('거절했으면 팝업을 다시 못 띄워 설정으로 보내야 한다', () => {
    expect(alarmBlocker(status({ permission: 'denied' }), 'ios')).toBe(
      'ios-settings',
    );
  });
});

describe('alarmBlocker — Android', () => {
  it('알림·정확한 알람·전체 화면이 다 켜져 있으면 막힌 게 없다', () => {
    expect(alarmBlocker(status(), 'android')).toBeNull();
  });

  it('알림이 꺼져 있으면 다른 것보다 먼저 알림을 켜게 한다', () => {
    expect(
      alarmBlocker(
        status({ notifications: false, exactAlarm: false }),
        'android',
      ),
    ).toBe('android-notifications');
  });

  it.each([
    ['정확한 알람이 꺼졌을 때', { exactAlarm: false }],
    ['전체 화면이 꺼졌을 때', { fullScreen: false }],
  ])('%s 설정 시트로 켜게 한다', (_, patch) => {
    expect(alarmBlocker(status(patch), 'android')).toBe('android-settings');
  });
});

describe('alarmBlocker — 알람을 못 쓰는 셸', () => {
  it('셸이 알람을 지원하지 않으면 막힘으로 치지 않는다 — 안내할 방법이 없다', () => {
    expect(
      alarmBlocker(status({ supported: false, permission: 'denied' }), 'ios'),
    ).toBeNull();
  });
});

describe('unblockAction', () => {
  it.each([
    [
      'iOS에서 아직 안 물었으면 AlarmKit 팝업을 띄운다',
      'ios-ask',
      'granted',
      'request-alarm',
    ],
    [
      'iOS에서 거절했으면 설정 안내 시트를 연다',
      'ios-settings',
      'granted',
      'ios-settings-sheet',
    ],
    [
      'Android 알림을 다시 물을 수 있으면 알림 팝업을 띄운다',
      'android-notifications',
      'undetermined',
      'request-notification',
    ],
    [
      'Android 알림을 두 번 거절해 못 물으면 앱 알림 설정을 연다',
      'android-notifications',
      'denied',
      'open-app-settings',
    ],
    [
      'Android 정확한 알람·전체 화면이 꺼졌으면 설정 시트를 연다',
      'android-settings',
      'granted',
      'android-settings-sheet',
    ],
  ] as const)('%s', (_, blocker, notification, expected) => {
    expect(unblockAction(blocker, notification)).toBe(expected);
  });
});

describe('setupPermissionStep — 다짐 직후 권한 단계', () => {
  it.each([
    ['막힌 게 없으면 바로 끝낸다', null, 'granted', 'finish'],
    ['iOS에서 아직 안 물었으면 팝업으로 묻는다', 'ios-ask', 'granted', 'ask'],
    [
      'Android 알림을 물을 수 있으면 팝업으로 묻는다',
      'android-notifications',
      'undetermined',
      'ask',
    ],
    [
      'Android 정확한 알람·전체 화면이 꺼졌으면 설정 시트를 연다',
      'android-settings',
      'granted',
      'android-sheet',
    ],
    [
      'iOS에서 이미 거절했으면 다시 조르지 않고 끝낸다 — 나중에 알람 화면 배너로 안내한다',
      'ios-settings',
      'granted',
      'finish',
    ],
    [
      'Android 알림을 두 번 거절했으면 다시 조르지 않고 끝낸다',
      'android-notifications',
      'denied',
      'finish',
    ],
  ] as const)('%s', (_, blocker, notification, expected) => {
    expect(setupPermissionStep(blocker, notification)).toBe(expected);
  });
});
