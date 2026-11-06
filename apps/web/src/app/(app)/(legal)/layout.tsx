// 약관·개인정보 처리방침 묶음의 레이아웃 — 두 문서 화면이 쓰는 문구 묶음(legal)을 브라우저로 보낸다
import { MessagesProvider } from '@/shared/i18n/MessagesProvider';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MessagesProvider namespaces={['legal']}>{children}</MessagesProvider>;
}
