// 탭 셸 — 헤더와 탭 칩을 탭들이 공유한다. 탭을 오가도 이 껍데기는 리마운트되지 않는다
import { APP_COLUMN_ID } from '@/shared/lib/app-column';

import { AppHeader } from './_ui/AppHeader';
import { TabBar } from './_ui/TabBar';
import { VISIBLE_TABS } from './_ui/tabs';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // relative는 화면 전체를 덮는 오버레이의 기준점이다 — 뷰포트가 아니라 이 컬럼까지만 덮어야 한다
    <main
      id={APP_COLUMN_ID}
      className="relative mx-auto flex h-dvh max-w-[430px] flex-col bg-muted"
    >
      <AppHeader />
      <TabBar tabs={VISIBLE_TABS} />
      {children}
    </main>
  );
}
