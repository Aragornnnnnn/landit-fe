// 시나리오 기록 레이아웃 — 지난 회차 목록과 회차 피드백이 쓰는 문구 묶음(scenario)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function ScenarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['scenario']}>{children}</MessagesProvider>
  );
}
