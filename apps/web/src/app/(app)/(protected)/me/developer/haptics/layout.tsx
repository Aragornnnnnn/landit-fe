// 햅틱 점검 레이아웃 — 리듬 미리보기가 실제 스트릭 도장과 복습 결과 화면을 그려서 그 화면들이 쓰는 문구 묶음을 더한다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function HapticCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessagesProvider namespaces={['streak', 'review']}>
      {children}
    </MessagesProvider>
  );
}
