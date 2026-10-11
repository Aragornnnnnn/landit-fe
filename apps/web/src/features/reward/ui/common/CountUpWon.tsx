'use client';

// 금액이 올라가는 숫자 — 오늘 받은 만큼이 방금 더해진 것처럼 보인다. 동작 줄이기를 켰으면 바로 끝 값을 보여 준다
import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

import { formatWon } from '@/shared/lib/won';

export const CountUpWon = ({
  from,
  to,
  delay = 0.25,
}: {
  from: number;
  to: number;
  // 숫자가 오르기 시작하기까지(초)
  delay?: number;
}) => {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(from);
  // 움직일 게 없으면 끝 값을 그대로 보여 준다
  const still = reduced || from === to;

  useEffect(() => {
    if (still) return;
    const controls = animate(from, to, {
      duration: 0.9,
      delay,
      ease: 'easeOut',
      onUpdate: (value) => setShown(Math.round(value)),
    });
    return () => controls.stop();
  }, [from, to, delay, still]);

  return (
    <>
      {/* 읽어 주는 값은 올라가는 중간 숫자가 아니라 끝 값이다 */}
      <span className="sr-only">{formatWon(to)}</span>
      <span aria-hidden className="tabular-nums">
        {formatWon(still ? to : shown)}
      </span>
    </>
  );
};
