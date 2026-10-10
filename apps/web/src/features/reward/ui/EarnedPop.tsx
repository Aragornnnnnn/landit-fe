'use client';

// 방금 받은 금액이 화면 위에서 톡 떨어졌다 사라지는 알림 — 학습을 멈추지 않는다. 누를 수도 없고 저절로 걷힌다
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { formatWon } from '@/shared/lib/won';

import { useEarnedPop } from '../model/earned-pop';
import { Coin } from './common/Coin';

// 읽고 지나가기에 충분한 시간
const STAY_MS = 1700;

export const EarnedPop = () => {
  const shown = useEarnedPop((state) => state.shown);
  const clear = useEarnedPop((state) => state.clear);

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(clear, STAY_MS);
    return () => clearTimeout(timer);
  }, [shown, clear]);

  return (
    <>
      {/* 낭독은 늘 붙어 있는 자리에서 한다 — 글자와 함께 나타나는 알림은 화면 낭독기가 건너뛰기 쉽다 */}
      <p role="status" className="sr-only">
        {shown && `환급액 ${formatWon(shown.earnedWon)}을 받았어요`}
      </p>
      <AnimatePresence>
        {shown && (
          <motion.div
            key={shown.completionId}
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-[max(var(--safe-area-inset-top),14px)] z-[60] flex justify-center"
            initial={{ y: -56, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 22 }}
          >
            <span className="animate-gold-flow flex items-center gap-1.5 rounded-full py-2 pr-4 pl-2.5 text-[17px] leading-none font-black text-[#4a2f00] shadow-lg">
              <motion.span
                className="flex"
                // 떨어져 닿은 동전이 한 번 튄다
                animate={{ rotate: [-30, 12, 0], scale: [1.4, 0.95, 1] }}
                transition={{ delay: 0.08, duration: 0.4 }}
              >
                <Coin size={24} />
              </motion.span>
              +{formatWon(shown.earnedWon)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
