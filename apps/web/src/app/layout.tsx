// 앱 전체 공통 레이아웃 (루트). 폰트는 globals.css에서 자체 호스팅하는 Pretendard 하나뿐이다
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { AlarmPropertiesSync } from '@/features/alarm/ui/AlarmPropertiesSync';
import { AlarmSync } from '@/features/alarm/ui/AlarmSync';
import { AppUpdateGate } from '@/features/app-update/ui/AppUpdateGate';
import { PushDeviceSync } from '@/features/notification/ui/PushDeviceSync';
import { ProfilePropertiesSync } from '@/features/onboarding/ui/ProfilePropertiesSync';
import { RewardPropertiesSync } from '@/features/reward/ui/RewardPropertiesSync';
import { SubscriptionPropertiesSync } from '@/features/subscription/ui/my-subscription/SubscriptionPropertiesSync';
import { IdentifySync } from '@/features/subscription/ui/purchase/IdentifySync';
import { WidgetChangeSync } from '@/features/widget/ui/WidgetChangeSync';
import { WidgetDataSync } from '@/features/widget/ui/WidgetDataSync';
import {
  AnalyticsBootstrap,
  PageViewTracker,
  TrackingStatusSync,
} from '@/shared/analytics';
import { BridgeListener } from '@/shared/bridge/BridgeListener';
import { platformMarkerScript } from '@/shared/bridge/platform-marker';
import { PlatformMarkerSync } from '@/shared/bridge/PlatformMarkerSync';
import { fontScaleScript } from '@/shared/font-scale/font-scale';
import { FontScaleSync } from '@/shared/font-scale/FontScaleSync';
import { GlobalHaptics } from '@/shared/haptics';
import { LocaleGate } from '@/shared/i18n/LocaleGate';
import {
  MessagesProvider,
  RootMessagesProvider,
} from '@/shared/i18n/MessagesProvider';
import { NativeLocaleSync } from '@/shared/i18n/NativeLocaleSync';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 저장 언어 쿠키(없으면 Accept-Language)로 정한 화면 언어 — API 요청도 html lang을 읽어 같은 언어를 보낸다
  const locale = await getLocale();
  const tAlarm = await getTranslations('alarm');

  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <body>
        {/* 첫 페인트 전에 플랫폼을 찍는다 — 하이드레이션 뒤에 찍으면 Android 하단 여백이 한 번 점프한다 */}
        <script dangerouslySetInnerHTML={{ __html: platformMarkerScript }} />
        {/* 첫 페인트 전에 글자 크기를 적용한다 — 하이드레이션 뒤에 적용하면 보통 크기로 그려졌다가 한 번 바뀐다 */}
        <script dangerouslySetInnerHTML={{ __html: fontScaleScript }} />
        {/* 브라우저엔 어디서나 쓰는 common만 보낸다 — 화면 문구는 그 화면의 layout이 MessagesProvider로 자기 묶음을 더한다 */}
        <RootMessagesProvider>
          <PlatformMarkerSync />
          <FontScaleSync />
          <AnalyticsBootstrap />
          <MonitoringBootstrap />
          <PageViewTracker />
          <BridgeListener />
          <GlobalHaptics />
          <Providers>
            {children}
            {/* 앱 업데이트 안내는 어느 화면에서나 뜬다 — 그 묶음만 여기서 더한다 */}
            <MessagesProvider namespaces={['appUpdate']}>
              <AppUpdateGate />
            </MessagesProvider>
            <PushDeviceSync />
            <LocaleGate />
            <NativeLocaleSync />
            <WidgetDataSync />
            <WidgetChangeSync />
            <TrackingStatusSync />
            <AlarmSync title={tAlarm('lockScreen.title')} />
            <IdentifySync />
            <SubscriptionPropertiesSync />
            <ProfilePropertiesSync />
            <RewardPropertiesSync />
            <AlarmPropertiesSync />
          </Providers>
          <Toaster />
          <SpeedInsights />
        </RootMessagesProvider>
      </body>
    </html>
  );
}
