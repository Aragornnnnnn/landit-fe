// 편지함 레이아웃 — 목록·작성·편지 화면이 쓰는 문구 묶음(mailbox)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function MailboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['mailbox']}>{children}</MessagesProvider>
  );
}
