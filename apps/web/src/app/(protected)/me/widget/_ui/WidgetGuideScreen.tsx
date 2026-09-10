'use client';

// 마이페이지에서 연 위젯 설치 안내 — 나중에·핀·홈으로가기 모두 마이페이지로 돌아온다.
// 안드로이드 핀과 홈으로가기는 셸에 맡긴다 (온보딩 위젯 스텝과 같은 콜백)
import { useRouter } from 'next/navigation';

import { InstallGuide } from '@/features/widget/ui/install-guide/InstallGuide';
import { postToNative } from '@/shared/bridge/web-bridge';
import { MY_PAGE_PATH } from '@/shared/lib/routes';

export const WidgetGuideScreen = () => {
  const router = useRouter();
  const back = () => router.replace(MY_PAGE_PATH);

  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6 text-foreground">
      <InstallGuide
        onDecline={back}
        onAndroidPin={() => {
          postToNative({ type: 'REQUEST_WIDGET_PIN' });
          back();
        }}
        onLeaveHome={() => {
          back();
          postToNative({ type: 'GO_HOME' });
        }}
      />
    </main>
  );
};
