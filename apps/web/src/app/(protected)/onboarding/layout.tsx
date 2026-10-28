// 온보딩 레이아웃 — 속마음 시연이 대화 화면의 말풍선을 그대로 써서 conversation 묶음을 더한다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function OnboardingLayout({
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
