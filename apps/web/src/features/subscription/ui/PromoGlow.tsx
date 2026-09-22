'use client';

// 할인 시트 머리 뒤에 깔리는 빛 — 위쪽이 따뜻하게 물들었다가 흰색으로 풀린다.
// 원의 테두리가 보이면 덧댄 티가 나므로 넓게 퍼뜨리고, 천천히 숨 쉬게 해 시선을 붙든다
import { motion, useReducedMotion } from 'motion/react';

/** 한 번 부풀었다 가라앉기까지. 눈에 걸리지 않을 만큼 느리게 */
const BREATH_SECONDS = 4.5;

export const PromoGlow = () => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-3xl"
    >
      <div className="absolute inset-x-0 top-0 h-[210px] bg-gradient-to-b from-primary/15 to-transparent" />
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        <motion.div
          className="h-[200px] w-[360px] rounded-full bg-primary/25 blur-[45px]"
          animate={
            reduced
              ? undefined
              : { opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }
          }
          transition={{
            duration: BREATH_SECONDS,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
};
