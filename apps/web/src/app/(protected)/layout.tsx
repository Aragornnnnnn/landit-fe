// 보호 그룹 레이아웃 — 로그인한 사람만 들인다. 보호가 필요한 페이지는 이 그룹에 넣는다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

import { AuthGate } from './_ui/AuthGate';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // onboarding 묶음을 여기서 보낸다 — 배울 영어 선택 폼과 시작 전 질문(ProfileGate)을 홈·내 정보도 같이 쓴다
  return (
    <MessagesProvider namespaces={['onboarding']}>
      <AuthGate>{children}</AuthGate>
    </MessagesProvider>
  );
}
