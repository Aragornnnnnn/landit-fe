'use client';

// 할인 시트 제목 뒤에 깔리는 장식용 빛 — 위쪽만 주황으로 물들었다가 아래로 갈수록 투명해진다
import { motion, useReducedMotion } from 'motion/react';

/** 빛이 한 번 커졌다 작아지는 데 걸리는 시간 */
const BREATH_SECONDS = 2.8;

/**
 * 시트 제목 뒤의 장식용 빛.
 *
 * 읽을 내용이 없어 `aria-hidden`이다. blur를 크게 줘서 원의 테두리가 드러나지 않게 하고,
 * 동작 줄이기를 켠 사람에게는 깜박임만 멈추고 빛 자체는 그대로 남긴다.
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
