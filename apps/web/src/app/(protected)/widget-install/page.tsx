// 위젯 설치 2차 재유도 라우트 — 대화를 마치고 홈으로 나가는 길에 한 번 들른다.
// 흐름 판정은 _model 훅이, 안내 화면은 InstallGuide가 맡고 여기선 조립만 한다
'use client';

import { Suspense } from 'react';

import { InstallGuide } from '@/features/widget/ui/install-guide/InstallGuide';

import { useWidgetInstallFlow } from './_model/useWidgetInstallFlow';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function WidgetInstallPage() {
  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6 text-foreground">
      <Suspense>
        <InstallFlow />
      </Suspense>
    </main>
  );
}

const InstallFlow = () => {
  const { supported, onDecline, onAndroidPin, onLeaveHome } =
    useWidgetInstallFlow();

  if (!supported) return null;

  return (
    <InstallGuide
      onDecline={onDecline}
      onAndroidPin={onAndroidPin}
      onLeaveHome={onLeaveHome}
    />
  );
};
