// 앱 화면 공통 레이아웃 — 로그인·학습·약관 화면이 함께 쓰는 분석, 브릿지, 동기화, 데이터 공급자를 둔다. 랜딩은 이 묶음 밖이라 받지 않는다
import { getTranslations } from 'next-intl/server';

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
  LanguagePropertySync,
  PageViewTracker,
  TrackingStatusSync,
} from '@/shared/analytics';
import { BridgeListener } from '@/shared/bridge/BridgeListener';
import { PlatformMarkerSync } from '@/shared/bridge/PlatformMarkerSync';
import { FontScaleSync } from '@/shared/font-scale/FontScaleSync';
import { GlobalHaptics } from '@/shared/haptics';
import { LocaleGate } from '@/shared/i18n/LocaleGate';
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';
import { NativeLocaleSync } from '@/shared/i18n/NativeLocaleSync';
import { MonitoringBootstrap } from '@/shared/monitoring/MonitoringBootstrap';
import { Toaster } from '@/shared/ui/toast';

import { Providers } from './providers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tAlarm = await getTranslations('alarm');

  return (
    <>
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
        <LanguagePropertySync />
        <AlarmSync title={tAlarm('lockScreen.title')} />
        <IdentifySync />
        <SubscriptionPropertiesSync />
        <ProfilePropertiesSync />
        <RewardPropertiesSync />
        <AlarmPropertiesSync />
      </Providers>
      <Toaster />
    </>
  );
}
