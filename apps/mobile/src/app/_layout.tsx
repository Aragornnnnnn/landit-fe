// 앱 루트 레이아웃 — WebView 셸 전환 전까지 최소 구성
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// 안드로이드 위젯 갱신은 헤드리스로 이 번들을 실행한다 — 모듈 로드 시점에 핸들러를 등록해야 한다
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } =
    require('react-native-android-widget') as typeof import('react-native-android-widget');
  const { widgetTaskHandler } =
    require('@/widgets/android/widget-task-handler') as typeof import('@/widgets/android/widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

export default function RootLayout() {
  return (
    <>
      {/* 라이트 테마 단일 — 상태바 아이콘 검은색 고정 */}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
