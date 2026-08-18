// 캐릭터를 눌러 보라는 코치마크 — 화면을 어둡게 깔고(Dim) 캐릭터 옆에 한마디(Bubble)만 띄운다.
// 딤은 화면 어디를 눌러도 반응하지 않는다 — 배우는 길은 캐릭터를 누르는 것 하나다
'use client';

import { motion } from 'motion/react';

const Dim = () => (
  <motion.div
    aria-hidden
    className="fixed inset-0 z-40 bg-black/60"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  />
);

// 머리 옆 말풍선 — 딤 위에서도 흰 카드라 눈이 먼저 간다. 살짝 둥실 떠서 살아 있음을 준다
const Bubble = () => (
  <motion.span
    className="pointer-events-none absolute top-2 left-[calc(50%+42px)] flex h-9 items-center rounded-2xl rounded-bl-md bg-card px-3.5 text-[13px] font-semibold whitespace-nowrap text-foreground shadow-md shadow-black/10"
    initial={{ y: 4, opacity: 0 }}
    animate={{ y: [0, -3, 0], opacity: 1 }}
    transition={{
      opacity: { duration: 0.3, delay: 0.15 },
      y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    }}
  >
    누르면 인사해요
  </motion.span>
);

export const GreetingCoach = { Dim, Bubble };
