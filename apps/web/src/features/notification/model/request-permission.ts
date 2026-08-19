// OS 알림 권한을 요청하고 셸의 회신으로 허용/거부를 계측한다 — 요청 지점(온보딩·홈 안내·내 정보)이 셋이라 한 곳에 모은다
import { EVENTS, type NotificationPermissionSource } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

export const requestNotificationPermission = (
  source: NotificationPermissionSource,
) => {
  // 회신 구독을 먼저 걸고 요청한다. 확정(허용/거부) 회신 한 번만 세고 빠진다 —
  // 답하기 전 도착한 조회 회신(undetermined)은 결과가 아니라 건너뛴다
  const unsubscribe = subscribeFromNative((message) => {
    if (message.type !== 'NOTIFICATION_PERMISSION') return;
    if (message.status === 'undetermined') return;
    unsubscribe();
    track(EVENTS.NOTIFICATION_PERMISSION_DECIDED, {
      granted: message.status === 'granted',
      source,
    });
  });
  postToNative({ type: 'REQUEST_NOTIFICATION_PERMISSION' });
};
