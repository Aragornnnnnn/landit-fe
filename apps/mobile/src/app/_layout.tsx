// 앱 루트 레이아웃 — WebView 셸 전환 전까지 최소 구성
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      {/* 라이트 테마 단일 — 상태바 아이콘 검은색 고정 */}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
