// 숫자 카운트업 — 시작 전엔 최종값, 시작하면 0부터 감속하며 올라간다.
// rAF가 아니라 타이머로 돈다. rAF가 멎은 웹뷰에서 중간값에 얼어붙지 않게 (LAN-375)
import { useEffect, useState } from 'react';

import { prefersReducedMotion } from './reduced-motion';

const TICK_MS = 40;

/** 끝으로 갈수록 느려진다 — 마지막 자릿수가 천천히 맞춰지는 느낌 */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const useCountUp = (target: number, active: boolean, duration = 900) => {
  const [elapsed, setElapsed] = useState(0);
  // 다른 등장 연출이 다 꺼지는 기기에서 숫자만 움직이면 안 된다
  const [reduced] = useState(prefersReducedMotion);
  const counting = active && !reduced;

  useEffect(() => {
    if (!counting) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const next = Date.now() - startedAt;
      setElapsed(next);
      if (next >= duration) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [counting, duration]);

  if (!counting) return target;
  return Math.round(target * easeOutCubic(Math.min(elapsed / duration, 1)));
};
