// 앱 전체 공통 레이아웃 (루트) — Tossface(이모지) CDN 로딩. Pretendard는 globals.css에서 자체 호스팅
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';

import { BridgeListener } from '@/shared/bridge/BridgeListener';
import { GlobalHaptics } from '@/shared/haptics';

import { Providers } from './providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'landit',
  description: 'landit',
};

// viewport-fit=cover가 있어야 노치 기기에서 env(safe-area-inset-*)가 실제 값으로 평가된다 (DESIGN.md safe-area 규칙의 전제)
// 웹뷰 셸 — 확대(핀치·더블탭) 차단 (웹앱을 앱 전용으로 보고 전역 적용)
export const viewport: Viewport = {
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
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
        <GlobalHaptics />
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
