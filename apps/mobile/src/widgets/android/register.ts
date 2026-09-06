// 안드로이드 위젯 태스크 핸들러 등록 — 위젯 추가·삭제·주기 갱신은 화면 없이(헤드리스) 이 번들을 실행하므로
// 라우터 레이아웃이 아니라 앱 진입점(index.ts)에서, 모듈 로드 시점에 등록해야 콜백이 버려지지 않는다
import { Platform } from 'react-native';

export const registerAndroidWidgetTaskHandler = (): void => {
  if (Platform.OS !== 'android') return;
  // 네이티브 모듈이 없는 환경(Expo Go 등)에서 앱이 죽지 않도록 지연 로드한다
  const { registerWidgetTaskHandler } =
    require('react-native-android-widget') as typeof import('react-native-android-widget');
  const { widgetTaskHandler } =
    require('./widget-task-handler') as typeof import('./widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
};
