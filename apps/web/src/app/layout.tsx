// 앱 전체 공통 레이아웃 (루트). 폰트는 globals.css에서 자체 호스팅하는 Pretendard 하나뿐이다
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';

import { AlarmSync } from '@/features/alarm/ui/AlarmSync';
import { AppUpdateGate } from '@/features/app-update/ui/AppUpdateGate';
import { PushDeviceSync } from '@/features/notification/ui/PushDeviceSync';
import { ProfilePropertiesSync } from '@/features/onboarding/ui/ProfilePropertiesSync';
import { SubscriptionPropertiesSync } from '@/features/subscription/ui/my-subscription/SubscriptionPropertiesSync';
import { IdentifySync } from '@/features/subscription/ui/purchase/IdentifySync';
import { WidgetChangeSync } from '@/features/widget/ui/WidgetChangeSync';
import { WidgetDataSync } from '@/features/widget/ui/WidgetDataSync';
import { AnalyticsBootstrap, PageViewTracker } from '@/shared/analytics';
import { BridgeListener } from '@/shared/bridge/BridgeListener';
import { platformMarkerScript } from '@/shared/bridge/platform-marker';
import { PlatformMarkerSync } from '@/shared/bridge/PlatformMarkerSync';
import { GlobalHaptics } from '@/shared/haptics';
import { MonitoringBootstrap } from '@/shared/monitoring/MonitoringBootstrap';
import { Toaster } from '@/shared/ui/toast';

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
      <body>
        {/* 첫 페인트 전에 플랫폼을 찍는다 — 하이드레이션 뒤에 찍으면 Android 하단 여백이 한 번 점프한다 */}
        <script dangerouslySetInnerHTML={{ __html: platformMarkerScript }} />
        <PlatformMarkerSync />
        <AnalyticsBootstrap />
        <MonitoringBootstrap />
        <PageViewTracker />
        <BridgeListener />
        <GlobalHaptics />
        <Providers>
          {children}
          <AppUpdateGate />
          <PushDeviceSync />
          <WidgetDataSync />
          <WidgetChangeSync />
          <AlarmSync />
          <IdentifySync />
          <SubscriptionPropertiesSync />
          <ProfilePropertiesSync />
        </Providers>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
