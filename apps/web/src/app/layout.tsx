// 앱 전체 공통 레이아웃 (루트) — Pretendard(본문)·Tossface(이모지) 폰트 로딩
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
    <html lang="ko" className="antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
