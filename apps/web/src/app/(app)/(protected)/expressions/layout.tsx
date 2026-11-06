// 표현 학습 레이아웃 — 발음 평가가 대화 화면의 마이크 버튼·권한 시트를 그대로 써서 conversation 묶음을 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function ExpressionsLayout({
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
