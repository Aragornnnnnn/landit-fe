// 프리뷰 점검 레이아웃 — 대화 직후 레벨 결과 화면을 그대로 띄워서 그 화면이 쓰는 conversation 묶음을 더한다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function PreviewCheckLayout({
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
