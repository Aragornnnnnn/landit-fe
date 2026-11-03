// 롤플레이 화면 레이아웃 — 시나리오 만들기가 쓰는 문구 묶음(roleplay)과, 캐릭터 이름이 있는 smallTalk 묶음을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function RoleplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['roleplay', 'smallTalk']}>
      {children}
    </MessagesProvider>
  );
}
