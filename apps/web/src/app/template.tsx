// 라우트 전환 템플릿 — 세그먼트가 바뀔 때마다 재마운트되며 페이지 진입 페이드를 전역에 입힌다.
import { PageTransition } from '@/shared/motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
