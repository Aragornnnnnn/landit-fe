// 앱 루트 레이아웃 — WebView 셸 전환 전까지 최소 구성. 안드로이드 위젯 핸들러 등록은 진입점(index.ts)에서 한다
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// 공개 DSN이라 번들에 들어가도 된다. 리터럴로 접근해야 빌드 시 치환된다
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// 네이티브 크래시·미처리 예외 수집은 여기서 시작된다 — DSN 없는 빌드(로컬 dev)는 꺼진 채로 지나간다.
// 트레이싱·리플레이는 켜지 않는다(기본값) — 앰플리튜드가 세션을 보고, 여기선 셸 크래시·결제 실패만 본다
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: __DEV__ ? 'development' : 'production',
});

const RootLayout = () => {
  return (
    <>
      {/* 라이트 테마 단일 — 상태바 아이콘 검은색 고정 */}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
};

// 루트를 감싸야 렌더 중 예외가 React 트리 정보와 함께 잡힌다.
// 탭 브레드크럼은 끈다 — 화면이 WebView 하나라 매 탭이 같은 경로를 네이티브로 넘기는 낭비다
export default Sentry.wrap(RootLayout, {
  touchEventBoundaryProps: { maxComponentTreeSize: 0 },
});
