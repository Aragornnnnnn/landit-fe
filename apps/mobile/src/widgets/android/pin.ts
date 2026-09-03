// 홈 화면에 위젯을 꽂는 시스템 다이얼로그를 요청한다 — 웹의 설치 안내 CTA가 브릿지로 부른다
import { Platform } from 'react-native';

import type { AndroidWidgetName } from './families';

// 2×2 하나만 청한다 — 다이얼로그는 위젯 하나씩만 보여줄 수 있고, 나머지 크기는 피커에서 고른다
const PIN_WIDGET: AndroidWidgetName = 'StreakSmall';

export const requestWidgetPin = (): void => {
  // iOS에는 위젯 갤러리를 여는 API 자체가 없다 — 웹이 화면으로 안내한다
  if (Platform.OS !== 'android') return;
  try {
    // 네이티브 모듈이 없는 환경(Expo Go 등)에서 앱이 죽지 않도록 지연 로드한다
    const { requestPinWidget } =
      require('react-native-android-widget') as typeof import('react-native-android-widget');
    requestPinWidget({ widgetName: PIN_WIDGET }).catch((error) =>
      console.warn('[widget] 핀 다이얼로그 요청 실패', error),
    );
  } catch (error) {
    console.warn('[widget] 위젯 모듈 로드 실패', error);
  }
};
