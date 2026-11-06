// 로그인 화면 묶음의 레이아웃 — 로그인·콜백 화면이 쓰는 문구 묶음(auth)을 브라우저로 보낸다
import type { Metadata } from 'next';

import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

// 앱 화면은 검색 결과에 올리지 않는다
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MessagesProvider namespaces={['auth']}>{children}</MessagesProvider>;
}
