// 알림 표시 정책 등록과 Android 채널 생성 — 셸 시작 시 1회 호출
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// 'default'는 채널 미지정 푸시가 게시되는 Expo 기본 채널 — 명시적으로 만들어 importance만 우리 값으로 올린다
const DEFAULT_CHANNEL_ID = 'default';

// 포그라운드 표시 정책 — 배너·목록은 보여주되 소리·배지는 어떤 알림에도 켜지 않는다
const FOREGROUND_BEHAVIOR = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: false,
  shouldSetBadge: false,
};

// 정책 핸들러를 등록하고 Android 채널을 만든다 — Android 13+ 권한 팝업은 채널이 있어야 뜬다
export const initializeNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => FOREGROUND_BEHAVIOR,
  });

  if (Platform.OS === 'android') {
    // importance HIGH — 헤드업 배너까지 띄우되 방해금지 모드는 뚫지 않는다
    await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
};
