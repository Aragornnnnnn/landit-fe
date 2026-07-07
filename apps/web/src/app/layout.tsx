// 앱 전체 공통 레이아웃 (루트) — Tossface(이모지) CDN 로딩. Pretendard는 globals.css에서 자체 호스팅
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
          href="https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
