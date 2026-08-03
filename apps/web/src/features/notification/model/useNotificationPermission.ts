'use client';

// OS 알림 권한 상태 훅 — unavailable은 권한 체계를 쓸 수 없는 환경(일반 브라우저·구버전 셸)이라는 뜻으로, 소비처는 전부 UI를 숨긴다
export type NotificationPermissionStatus =
  'granted' | 'denied' | 'undetermined' | 'unavailable';

export const useNotificationPermission = (): NotificationPermissionStatus => {
  // LAN-189 후속 PR에서 GET_NOTIFICATION_PERMISSION 왕복으로 교체한다 — 그 전까지 알림 UI는 전부 잠복 상태
  return 'unavailable';
};
