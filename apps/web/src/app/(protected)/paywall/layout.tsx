// 페이월 레이아웃 — 페이월 화면과 데모가 쓰는 문구 묶음(paywall)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function PaywallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['paywall']}>{children}</MessagesProvider>
  );
}
