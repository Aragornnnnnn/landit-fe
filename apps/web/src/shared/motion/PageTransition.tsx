// 라우트 전환 래퍼 — 매 페이지 진입 시 페이드 인. app/template.tsx에서 전역 적용한다.
// 페이드는 motion 대신 CSS 애니메이션으로 재생한다 — 일부 iOS WebView의 흰 화면(LAN-375)이
// "콜드 스타트에서 rAF가 재개되지 않아 opacity 0에 갇힌다"로 추정되어, rAF 없이 재생되고
// 안 돌아도 기본 상태가 '보임'인 구조를 택했다. 연출 자체(0.25s 페이드)는 기존과 동일하다.
// reduced motion 분기는 CSS 미디어 쿼리가 담당한다 (page-transition.module.css)
import styles from './page-transition.module.css';

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.fadeIn}>{children}</div>
);
