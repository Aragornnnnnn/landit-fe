// 대화 화면 묶음의 레이아웃 — 시나리오·스몰톡 대화가 쓰는 문구 묶음(conversation)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function ConversationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['conversation']}>
      {children}
    </MessagesProvider>
  );
}
