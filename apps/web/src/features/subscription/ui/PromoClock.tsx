'use client';

// 남은 시간 표시 — 바뀌는 자리만 위로 굴러 올라간다. 할인 시트와 헤더 배지가 같이 쓴다
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { DURATION, EASE_STANDARD } from '@/shared/motion';

import { formatPromoClock } from '../model/promo-clock';

interface PromoClockProps {
  /** 남은 초 */
  seconds: number;
}

/**
 * 분:초를 그리되 숫자가 바뀔 때만 한 자리씩 굴린다.
 *
 * 매초 전체를 새로 그리면 툭툭 끊겨 보인다. 자리마다 따로 두면 초의 1의 자리만 움직이고
 * 나머지는 가만히 있어, 시선이 시간에 붙잡히지 않는다.
 */
export const PromoClock = ({ seconds }: PromoClockProps) => (
  <span className="inline-flex items-center tabular-nums">
    {formatPromoClock(seconds)
      .split('')
      .map((char, index) =>
        char === ':' ? (
          // 콜론은 굴리지 않는다 — 움직이면 두 숫자 사이가 흔들려 보인다
          <span key="colon" className="px-px">
            {char}
          </span>
        ) : (
          <Digit key={index} value={char} />
        ),
      )}
  </span>
);

const Digit = ({ value }: { value: string }) => {
  const reduced = useReducedMotion() ?? false;
  // 0~9가 같은 폭을 쓰도록 자리를 고정한다. 안 그러면 1이 나올 때 시계가 줄어든다
  return (
    <span className="relative inline-block h-[1.2em] w-[0.6em] overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={value}
          className="absolute inset-0 flex items-center justify-center"
          initial={reduced ? { opacity: 0 } : { y: '100%' }}
          animate={reduced ? { opacity: 1 } : { y: 0 }}
          exit={reduced ? { opacity: 0 } : { y: '-100%' }}
          transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
