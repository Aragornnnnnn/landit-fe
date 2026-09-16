'use client';

// 안내 화면의 말풍선 — 떨어져 자리 잡은 뒤 숨 쉬듯 천천히 오르내린다.
// "얘기를 들으러 왔다"는 화면이라 요란하지 않게. 연출을 끈 사람에겐 가만히 둔다
import { motion, useReducedMotion } from 'motion/react';

import { Emoji } from '@/shared/ui/emoji';

// 한 번 오르내리는 데 걸리는 시간과 떨어져 자리 잡는 시간
const FLOAT_SECONDS = 3.2;
const LANDING_SECONDS = 0.9;

export const SpeechBubble = () => {
  const reduced = useReducedMotion() ?? false;
  const cycle = {
    duration: FLOAT_SECONDS,
    repeat: Infinity,
    delay: LANDING_SECONDS,
    ease: 'easeInOut' as const,
  };

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={reduced ? false : { scale: 0.6, opacity: 0, y: -40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
    >
      {/* 바닥 그림자 — 떠오를 때 작아져 높이가 느껴진다 */}
      <motion.span
        aria-hidden
        className="absolute bottom-1 h-4 w-28 rounded-full bg-foreground/10 blur-sm"
        animate={
          reduced ? undefined : { scaleX: [1, 0.86, 1], opacity: [1, 0.6, 1] }
        }
        transition={cycle}
      />

      <motion.div
        className="relative text-[120px] leading-none"
        animate={reduced ? undefined : { y: [0, -14, 0] }}
        transition={cycle}
      >
        <Emoji>💬</Emoji>
      </motion.div>
    </motion.div>
  );
};
