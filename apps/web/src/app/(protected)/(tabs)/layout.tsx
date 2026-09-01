// 탭 셸 — 헤더와 탭 칩을 탭들이 공유한다. 탭을 오가도 이 껍데기는 리마운트되지 않는다
import { ProfileGate } from '@/features/onboarding/ui/ProfileGate';

import { AppHeader } from '../_ui/AppHeader';
import { RememberLastTab } from './_ui/RememberLastTab';
import { TabBar } from './_ui/TabBar';
import { VISIBLE_TABS } from './_ui/tabs';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-muted">
      <RememberLastTab />
      <AppHeader />
      <TabBar tabs={VISIBLE_TABS} />
      {children}
      {/* 어느 탭으로 들어오든 무조건 앞을 막는다 — 온보딩을 마쳤지만 아직 답 안 한 기존 유저만 대상 */}
      <ProfileGate />
    </main>
  );
}
