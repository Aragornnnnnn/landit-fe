'use client';

// 학습을 끝낸 순간 — 환급 참여자에게 방금 받은 금액과 오늘 남은 몫을 보여 준다.
// 순서가 곧 의미다. 동전이 떨어져 닿고, 금액이 올라가고, 오늘 칸들이 선 뒤 방금 끝낸 칸이 찬다
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { EASE_STANDARD } from '@/shared/motion';

import type { CompletionEarn } from '../model/completion-earn';
import { Coin } from './common/Coin';
import { CountUpWon } from './common/CountUpWon';
import { TodayTiles } from './common/TodayTiles';

// 동전이 닿은 뒤에 금액이 서고, 오늘 칸이 서고, 방금 끝낸 칸이 찬다
const DROP_DELAY = 0.15;
const AMOUNT_DELAY = 0.5;
const TILES_DELAY = 0.7;
const FILL_DELAY = 1.25;

export const EarnedStamp = ({ earn }: { earn: CompletionEarn }) => {
  const animated = !useReducedMotion();
  // 뒤늦게 차는 칸은 하나뿐이라 타이머도 여기 하나만 둔다
  const [filled, setFilled] = useState(!animated);
  useEffect(() => {
    if (!animated) return;
    const timer = setTimeout(() => setFilled(true), FILL_DELAY * 1000);
    return () => clearTimeout(timer);
  }, [animated]);
  // 차기 전의 그 칸은 아직 안 한 모습이다 — 회색 동전과, 이번에 받을 금액
  const slots = filled
    ? earn.slots
    : earn.slots.map((slot) =>
        slot.type === earn.activityType
          ? {
              ...slot,
              progress: 0,
              remainingWon: earn.earnedWon,
              countLabel: null,
            }
          : slot,
      );

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
      <div className="relative flex size-[132px] items-center justify-center">
        {/* 동전 뒤에 깔리는 온기 — 닿은 자리가 밝아야 동전이 무게를 갖는다 */}
        <span
          aria-hidden
          className="absolute size-[132px] rounded-full bg-streak-band blur-xl"
        />
        <motion.div
          className="relative"
          initial={animated ? { y: -64, scale: 1.3, opacity: 0 } : false}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{
            delay: DROP_DELAY,
            type: 'spring',
            stiffness: 620,
            damping: 20,
          }}
        >
          <Coin size={96} />
        </motion.div>
      </div>

      <motion.div
        className="mt-4 flex flex-col items-center"
        initial={animated ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: AMOUNT_DELAY, duration: 0.32 }}
      >
        <p className="text-[40px] leading-none font-black text-primary">
          +
          <CountUpWon from={0} to={earn.earnedWon} delay={AMOUNT_DELAY} />
        </p>
        <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
          {earn.guide}
        </p>
      </motion.div>

      <motion.div
        className="mt-9 w-full"
        initial={animated ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: TILES_DELAY, duration: 0.35, ease: EASE_STANDARD }}
      >
        <TodayTiles slots={slots} />
      </motion.div>
    </div>
  );
};
