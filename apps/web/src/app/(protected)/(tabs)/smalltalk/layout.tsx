// 스몰톡 탭 레이아웃 — 상대 고르기·안내·주제 고르기가 쓰는 문구 묶음(smallTalk)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function SmallTalkTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['smallTalk']}>{children}</MessagesProvider>
  );
}
