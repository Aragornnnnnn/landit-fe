// 알람 권한 — 셸 상태에서 무엇이 막혀 알람이 안 울리는지 가른다. 막힌 것마다 풀어 주는 길이 다르다
import type { AlarmStatus, NotificationPermissionStatus } from '@landit/bridge';

export type AlarmBlocker =
  // iOS: 아직 묻지 않음 → AlarmKit 팝업
  | 'ios-ask'
  // iOS: 거절함 → 팝업을 다시 못 띄워 설정 앱으로
  | 'ios-settings'
  // Android: 알림이 꺼짐 → 알림 권한 팝업, 다시 못 물으면 앱 알림 설정
  | 'android-notifications'
  // Android: 정확한 알람·전체 화면 중 꺼진 것 → 설정 안내 시트
  | 'android-settings';

export const alarmBlocker = (
  status: AlarmStatus,
  platform: 'ios' | 'android',
): AlarmBlocker | null => {
  // 알람을 못 쓰는 셸이면 켜게 할 방법이 없다
  if (!status.supported) return null;
  if (platform === 'ios') {
    if (status.permission === 'undetermined') return 'ios-ask';
    if (status.permission === 'denied') return 'ios-settings';
    return null;
  }
  // 알림이 꺼진 Android는 울려도 끌 손잡이가 없어서 셸이 아예 걸지 않는다 — 가장 먼저 켜게 한다
  if (!status.notifications) return 'android-notifications';
  if (!status.exactAlarm || !status.fullScreen) return 'android-settings';
  return null;
};

export type UnblockAction =
  | 'request-alarm'
  | 'ios-settings-sheet'
  | 'request-notification'
  | 'open-app-settings'
  | 'android-settings-sheet';

// 막힌 것을 풀 동작 — Android 알림은 다시 물을 수 있으면 팝업, 두 번 거절해 못 물으면 앱 알림 설정이다
export const unblockAction = (
  blocker: AlarmBlocker,
  // 셸이 알림 권한을 못 알려 주면(unavailable) 물어볼 수 있는 것으로 본다
  notificationPermission: NotificationPermissionStatus | 'unavailable',
): UnblockAction => {
  switch (blocker) {
    case 'ios-ask':
      return 'request-alarm';
    case 'ios-settings':
      return 'ios-settings-sheet';
    case 'android-notifications':
      return notificationPermission === 'denied'
        ? 'open-app-settings'
        : 'request-notification';
    case 'android-settings':
      return 'android-settings-sheet';
  }
};

export type SetupPermissionStep = 'ask' | 'android-sheet' | 'finish';

// 다짐 직후 권한 단계 — 팝업으로 물을 수 있으면 묻고, Android 설정이 꺼졌으면 시트를 연다.
// 이미 거절해 팝업을 못 띄우는 사람은 등록 흐름에서 조르지 않는다(알람 화면 배너가 안내한다)
export const setupPermissionStep = (
  blocker: AlarmBlocker | null,
  notificationPermission: NotificationPermissionStatus | 'unavailable',
): SetupPermissionStep => {
  if (!blocker) return 'finish';
  switch (unblockAction(blocker, notificationPermission)) {
    case 'request-alarm':
    case 'request-notification':
      return 'ask';
    case 'android-settings-sheet':
      return 'android-sheet';
    case 'ios-settings-sheet':
    case 'open-app-settings':
      return 'finish';
  }
};
