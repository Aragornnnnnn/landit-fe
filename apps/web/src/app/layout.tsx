// 앱 전체 공통 레이아웃 (루트) — 폰트·메타데이터는 디자인 확정 시 채운다
import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'landit',
  description: 'landit',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
