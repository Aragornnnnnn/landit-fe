'use client';

// 할인 시트 머리 뒤에 깔리는 빛 — 위쪽이 따뜻하게 물들었다가 흰색으로 풀린다.
// 원의 테두리가 보이면 덧댄 티가 나므로 넓게 퍼뜨리고, 천천히 숨 쉬게 해 시선을 붙든다
import { motion, useReducedMotion } from 'motion/react';

/** 한 번 부풀었다 가라앉기까지. 맥박처럼 읽힐 만큼만 빠르게 */
const BREATH_SECONDS = 2.8;

/**
 * 시트 머리 뒤에 깔리는 빛.
 *
 * 읽을 것이 없는 장식이라 `aria-hidden`이고, 동작 줄이기를 켠 사람에게는 숨만 멈추고 빛은 남는다.
 */
export const PromoGlow = () => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-3xl"
    >
      <div className="absolute inset-x-0 top-0 h-[150px] bg-gradient-to-b from-primary/8 to-transparent" />
      <div className="absolute top-[22px] left-1/2 -translate-x-1/2">
        <motion.div
          className="h-[140px] w-[268px] rounded-full bg-primary/35 blur-[32px]"
          animate={
            reduced
              ? undefined
              : { opacity: [0.65, 1, 0.65], scale: [1, 1.12, 1] }
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
