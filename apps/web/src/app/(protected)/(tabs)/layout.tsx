// 탭 셸 — 헤더와 탭 칩을 탭들이 공유한다. 탭을 오가도 이 껍데기는 리마운트되지 않는다
import { AppHeader } from './_ui/AppHeader';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-muted">
      <AppHeader />
      {children}
    </main>
  );
}
