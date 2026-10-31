// 롤플레이 탭 레이아웃 — 빈 상태·내 시나리오 목록이 쓰는 문구 묶음(roleplay)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function RoleplayTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['roleplay']}>{children}</MessagesProvider>
  );
}
