// 알림 권한 조회·요청 — expo 권한 응답을 브릿지의 세 상태로 줄여 웹에 알린다
import type { NotificationPermissionStatus } from '@landit/bridge';
import * as Notifications from 'expo-notifications';

// 웹에 알릴 상태만 뽑는다 — denied라도 다시 물을 수 있으면 아직 요청 가능한 상태(undetermined)로 본다
export const toPermissionStatus = (response: {
  status: string;
  canAskAgain: boolean;
}): NotificationPermissionStatus => {
  if (response.status === 'granted') return 'granted';
  if (response.status === 'denied' && !response.canAskAgain) return 'denied';
  return 'undetermined';
};

// 권한 상태 조회 — OS 다이얼로그를 띄우지 않는다
export const getNotificationPermission =
  async (): Promise<NotificationPermissionStatus> =>
    toPermissionStatus(await Notifications.getPermissionsAsync());

// 권한 능동 요청 — OS 권한창이 뜰 수 있다
export const requestNotificationPermission =
  async (): Promise<NotificationPermissionStatus> =>
    toPermissionStatus(await Notifications.requestPermissionsAsync());
