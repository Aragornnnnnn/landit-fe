// 지난 스몰톡 레이아웃 — 기록 목록·한 건·대화 다시 보기·오늘의 스몰톡이 쓰는 문구 묶음(smallTalk)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function SmallTalkHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['smallTalk']}>{children}</MessagesProvider>
  );
}
