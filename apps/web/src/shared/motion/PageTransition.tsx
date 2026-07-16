// 라우트 전환 래퍼 — 매 페이지 진입 시 페이드 인. app/template.tsx에서 전역 적용한다.
'use client';

import { motion, useReducedMotion } from 'motion/react';

import { DURATION, EASE_STANDARD } from './tokens';

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const reduced = useReducedMotion() ?? false;

  // reduced motion이면 애니메이션 없이 그대로 — 래퍼 div가 h-dvh 레이아웃을 방해하지 않게 contents로 흘린다.
  if (reduced) return <div style={{ display: 'contents' }}>{children}</div>;

  return (
    <motion.div
      // 페이드만 — transform이 없어 fixed 오버레이의 기준이 뷰포트로 유지된다.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
    >
      {children}
    </motion.div>
  );
};
