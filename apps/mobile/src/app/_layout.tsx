// 앱 루트 레이아웃 — WebView 셸 전환 전까지 최소 구성
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
