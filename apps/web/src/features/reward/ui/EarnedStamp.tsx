'use client';

// 시나리오 대화를 끝낸 순간 — 환급 참여자에게 방금 받은 금액을 보여 준다.
// 순서가 곧 의미다. 동전이 떨어져 닿고, 금액이 올라간다
import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { haptic } from '@/shared/haptics';

import type { CompletionEarn } from '../model/completion-earn';
import { Coin } from './common/Coin';
import { CountUpWon } from './common/CountUpWon';

// 동전이 닿은 뒤에 금액이 선다
const DROP_DELAY = 0.15;
const AMOUNT_DELAY = 0.5;
// 떨어지기 시작해 바닥에 닿기까지 — 센 스프링이라 금방 닿는다
const LAND_AFTER = 0.1;

export const EarnedStamp = ({ earn }: { earn: CompletionEarn }) => {
  const animated = !useReducedMotion();

  // 동전이 닿는 순간 손에도 닿게 한다 — 동작 줄이기로 떨어지는 연출이 없으면 기다리지 않고 바로 울린다
  useEffect(() => {
    const landAt = animated ? (DROP_DELAY + LAND_AFTER) * 1000 : 0;
    const timer = setTimeout(() => haptic('celebrate'), landAt);
    return () => clearTimeout(timer);
  }, [animated]);

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
          오늘 몫을 받았어요
        </p>
      </motion.div>
    </div>
  );
};
