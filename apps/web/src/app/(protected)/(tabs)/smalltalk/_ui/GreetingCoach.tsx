// 캐릭터를 눌러 보라는 코치마크 — 화면을 어둡게 깔고(CoachDim) 캐릭터 옆에 한마디(CoachBubble)만 띄운다.
// 딤은 어디를 눌러도 반응하지 않는다 — 배우는 길은 캐릭터를 누르는 것 하나다. 나타나고 사라지는 건 페이지의 AnimatePresence가 맡는다
'use client';

import { motion, useReducedMotion } from 'motion/react';

import { DURATION } from '@/shared/motion';

export const CoachDim = () => (
  <motion.div
    aria-hidden
    className="fixed inset-0 z-40 bg-black/60"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: DURATION.base }}
  />
);

// 머리 옆 말풍선 — 딤 위에서도 흰 카드라 눈이 먼저 간다. 살짝 둥실 떠서 살아 있음을 주되, 움직임 줄이기면 가만히 있는다
export const CoachBubble = () => {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className="pointer-events-none absolute top-2 left-[calc(50%+42px)] flex h-9 items-center rounded-2xl rounded-bl-md bg-card px-3.5 text-[13px] font-semibold whitespace-nowrap text-foreground shadow-md shadow-black/10"
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: reduced ? 0 : [0, -3, 0], opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: DURATION.base, delay: 0.15 },
        y: reduced
          ? { duration: DURATION.base }
          : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      누르면 인사해요
    </motion.span>
  );
};
