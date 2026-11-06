// 라우트 전환 템플릿 — 세그먼트가 바뀔 때마다 재마운트되며 앱 화면에 페이지 진입 페이드를 입힌다. 랜딩은 이 묶음 밖이라 첫 그림이 바로 보인다.
import { PageTransition } from '@/shared/motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
