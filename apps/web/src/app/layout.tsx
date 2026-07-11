// 앱 전체 공통 레이아웃 (루트) — Tossface(이모지) CDN 로딩. Pretendard는 globals.css에서 자체 호스팅
import type { Metadata, Viewport } from 'next';

import { BridgeListener } from '@/shared/bridge/BridgeListener';

import './globals.css';

export const metadata: Metadata = {
  title: 'landit',
  description: 'landit',
};

// viewport-fit=cover가 있어야 노치 기기에서 env(safe-area-inset-*)가 실제 값으로 평가된다 (DESIGN.md safe-area 규칙의 전제)
export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="antialiased" suppressHydrationWarning>
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
      <body>
        <BridgeListener />
        {children}
      </body>
    </html>
  );
}
