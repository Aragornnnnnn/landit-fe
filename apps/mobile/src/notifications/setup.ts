// 알림 표시 정책 등록과 Android 채널 생성 — 셸 시작 시 1회 호출
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { REMINDER_CHANNEL_ID, REMINDER_KIND } from './reminder-schedule';

// 포그라운드 표시 정책 — 우리 리마인더는 앱을 쓰는 중이니 배너만 가리고, 알림 센터에는 남겨 나중에 보게 한다
export const resolveForegroundBehavior = (data: unknown) => {
  const isOurReminder =
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).kind === REMINDER_KIND;

  return {
    shouldShowBanner: !isOurReminder,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  };
};

// 정책 핸들러를 등록하고 Android 채널을 만든다 — Android 13+ 권한 팝업은 채널이 있어야 뜬다
export const initializeNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) =>
      resolveForegroundBehavior(notification.request.content.data),
  });

  if (Platform.OS === 'android') {
    // importance HIGH — 헤드업 배너까지 띄우되 방해금지 모드는 뚫지 않는다
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
};
