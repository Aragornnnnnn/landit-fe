// 푸시 복습 레이아웃 — 복습 안내·결과 화면이 쓰는 review 묶음을 보낸다 (퀴즈 화면의 expression 묶음은 보호 그룹이 보낸다)
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['review']}>{children}</MessagesProvider>
  );
}
