// 환급 페이월 점검 레이아웃 — 환급 페이월이 일반 페이월 데모를 같이 써서 paywall 묶음을 더한다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function RewardPaywallCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['paywall']}>{children}</MessagesProvider>
  );
}
