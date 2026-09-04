'use client';

// 안내 화면의 선물 상자 — 떨어져 자리 잡은 뒤, 몇 초마다 안에 뭐가 든 듯 들썩이고 튀어오르며 불꽃을 튀긴다.
// 열리기 직전의 상자라 "누르면 받는다"는 기대를 만든다. 연출을 끈 사람에겐 가만히 둔다
import { motion, useReducedMotion } from 'motion/react';

import { Emoji } from '@/shared/ui/emoji';

// 한 번 들썩이는 데 걸리는 시간과 다음 들썩임까지의 쉼
const SHAKE_SECONDS = 1.1;
const REST_SECONDS = 1.7;
// 떨어져 자리 잡는 시간 — 그 뒤부터 들썩인다
const LANDING_SECONDS = 0.9;

// 상자를 둘러싼 불꽃 — 각도별로 바깥으로 튄다. 크기와 색을 섞어 한 덩어리로 안 보이게
const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => ({
  angle,
  size: index % 2 === 0 ? 10 : 7,
  // 별점 색(노랑)과 주황을 섞는다 — star-filled는 Tailwind 색 토큰이 아니라 변수로 직접 칠한다
  color: index % 3 === 0 ? 'var(--star-filled)' : 'var(--primary)',
  delay: (index % 4) * 0.05,
}));
const SPARK_DISTANCE = 96;

export const GiftBox = () => {
  const reduced = useReducedMotion() ?? false;
  const cycle = {
    duration: SHAKE_SECONDS,
    repeat: Infinity,
    repeatDelay: REST_SECONDS,
    delay: LANDING_SECONDS,
  };

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={reduced ? false : { scale: 0.6, opacity: 0, y: -40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
    >
      {!reduced &&
        SPARKS.map(({ angle, size, color, delay }) => {
          const radians = (angle * Math.PI) / 180;
          return (
            <motion.span
              key={angle}
              aria-hidden
              className="absolute rounded-full"
              style={{ width: size, height: size, backgroundColor: color }}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0, 1, 0],
                scale: [0, 0, 1.2, 0.4],
                x: [
                  0,
                  0,
                  Math.cos(radians) * SPARK_DISTANCE * 0.6,
                  Math.cos(radians) * SPARK_DISTANCE,
                ],
                y: [
                  0,
                  0,
                  Math.sin(radians) * SPARK_DISTANCE * 0.6,
                  Math.sin(radians) * SPARK_DISTANCE,
                ],
              }}
              transition={{
                ...cycle,
                delay: cycle.delay + delay,
                ease: 'easeOut',
              }}
            />
          );
        })}

      {/* 바닥 그림자 — 튀어오를 때 작아져 높이가 느껴진다 */}
      <motion.span
        aria-hidden
        className="absolute bottom-1 h-4 w-28 rounded-full bg-foreground/10 blur-sm"
        animate={
          reduced
            ? undefined
            : {
                scaleX: [1, 1.05, 0.95, 1.05, 0.95, 0.6, 1.1, 1],
                opacity: [1, 1, 1, 1, 1, 0.5, 1, 1],
              }
        }
        transition={{ ...cycle, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative text-[120px] leading-none"
        animate={
          reduced
            ? undefined
            : {
                rotate: [0, -7, 7, -6, 6, 0, 0, 0],
                y: [0, 0, 0, 0, 0, -36, 0, 0],
                scaleY: [1, 1, 1, 1, 0.92, 1.1, 0.94, 1],
              }
        }
        transition={{ ...cycle, ease: 'easeInOut' }}
      >
        <Emoji>🎁</Emoji>
      </motion.div>
    </motion.div>
  );
};
