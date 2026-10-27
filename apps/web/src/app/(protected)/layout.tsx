// 보호 그룹 레이아웃 — 로그인한 사람만 들인다. 보호가 필요한 페이지는 이 그룹에 넣는다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

import { AuthGate } from './_ui/AuthGate';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 여러 화면이 같이 쓰는 묶음은 여기서 보낸다 — onboarding은 배울 영어 선택 폼·시작 전 질문(홈·내 정보),
  // notification은 알림 잠금화면 목업(온보딩·홈 시트)
  return (
    <MessagesProvider namespaces={['onboarding', 'notification']}>
      <AuthGate>{children}</AuthGate>
    </MessagesProvider>
  );
}
