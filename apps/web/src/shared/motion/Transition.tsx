// 플로우 내 화면 전환 — AnimatePresence 기반, 방향성 슬라이드 또는 페이드. 접근성(reduced motion) 대응.
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { DURATION, EASE_STANDARD, fadeVariants, slideVariants } from './tokens';

interface TransitionProps {
  // 값이 바뀔 때마다 전환이 일어난다 (스텝 이름·뷰 이름 등)
  transitionKey: string;
  // 1 전진, -1 후진. slide에서만 쓰인다.
  direction?: number;
  // fixed 오버레이를 품은 전면 화면 교체는 fade로 — transform이 오버레이 기준을 깨지 않게 한다.
  fade?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Transition = ({
  transitionKey,
  direction = 1,
  fade = false,
  className,
  style,
  children,
}: TransitionProps) => {
  const reduced = useReducedMotion() ?? false;
  const variants = fade ? fadeVariants : slideVariants(reduced);

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={transitionKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
        className={className}
        style={style}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
