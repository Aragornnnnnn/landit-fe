// 홈 화면에 위젯을 꽂는 시스템 다이얼로그를 요청한다 — 웹의 설치 안내 CTA가 브릿지로 부른다
import { Platform } from 'react-native';

export const requestWidgetPin = (): void => {
  // iOS에는 위젯 갤러리를 여는 API 자체가 없다 — 웹이 화면으로 안내한다
  if (Platform.OS !== 'android') return;
  try {
    const { requestPinWidget } =
      require('react-native-android-widget') as typeof import('react-native-android-widget');
    // 2×2 하나만 청한다 — 다이얼로그는 위젯 하나씩만 보여줄 수 있고, 나머지 크기는 피커에서 고른다
    requestPinWidget({ widgetName: 'StreakSmall' }).catch((error) =>
      console.warn('[widget] 핀 요청 실패', error),
    );
  } catch (error) {
    console.warn('[widget] 핀 요청 실패', error);
  }
};
