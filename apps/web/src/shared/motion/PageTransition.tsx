// 라우트 전환 래퍼 — 매 페이지 진입 시 페이드 인. app/template.tsx에서 전역 적용한다.
// 페이드는 CSS 애니메이션으로 재생한다 — motion(rAF 의존)은 일부 iOS WebView에서 콜드
// 스타트 시 rAF가 재개되지 않으면 페이지 전체가 opacity 0에 갇혀 흰 화면이 됐다.
// CSS 애니메이션은 rAF 없이 재생되고, 안 돌아도 기본 상태가 '보임'이라 화면을 인질로
// 잡지 않는다. reduced motion 분기는 CSS 미디어 쿼리가 담당한다 (page-transition.module.css)
import styles from './page-transition.module.css';

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.fadeIn}>{children}</div>
);
