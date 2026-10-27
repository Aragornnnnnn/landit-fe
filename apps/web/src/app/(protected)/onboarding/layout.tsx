// 온보딩 레이아웃 — 속마음 시연이 대화 화면의 말풍선을 그대로 써서 conversation 묶음도 함께 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 안쪽 Provider는 바깥 묶음을 갈아 끼우므로 보호 그룹이 보낸 onboarding·notification·widget도 다시 적는다
  return (
    <MessagesProvider
      namespaces={['onboarding', 'notification', 'widget', 'conversation']}
    >
      {children}
    </MessagesProvider>
  );
}
