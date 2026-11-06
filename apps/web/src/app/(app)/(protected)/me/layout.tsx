// 내 정보 구역 레이아웃 — 내 정보 탭과 설정 시트가 쓰는 me 묶음을 더한다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MessagesProvider namespaces={['me']}>{children}</MessagesProvider>;
}
