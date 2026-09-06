'use client';

// 발음 점수 반원 게이지 — 진입 시 호가 0에서 점수까지 차오르고 숫자가 함께 카운트업된다 (토스 신용점수 문법).
// 호는 CSS 트랜지션이라 rAF가 멎은 웹뷰에서도 돌고, 숫자는 rAF 카운트업 + 타이머 안전장치로 최종값을 보장한다
import { useEffect, useState } from 'react';

import type { ScoreView } from '../../model/pronunciation-score';

const TONE_STROKE = {
  red: 'text-destructive',
  yellow: 'text-amber-400',
  green: 'text-success',
} as const;

const TONE_CHIP = {
  red: 'bg-destructive text-destructive-foreground',
  yellow: 'bg-amber-400 text-white',
  green: 'bg-success text-success-foreground',
} as const;

const COUNT_MS = 900;

export const ScoreGauge = ({ view }: { view: ScoreView }) => {
  // 호 채움 — 0으로 그렸다가 다음 프레임에 목표값으로 바꿔 CSS 트랜지션이 차오르게 한다
  const [fill, setFill] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fillRaf = requestAnimationFrame(() => setFill(view.display));

    const start = performance.now();
    let countRaf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / COUNT_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(view.display * eased));
      if (t < 1) countRaf = requestAnimationFrame(tick);
    };
    countRaf = requestAnimationFrame(tick);

    // rAF가 멎는 웹뷰 대비 — 시간이 지나면 최종값을 못박는다
    const safety = setTimeout(() => {
      setFill(view.display);
      setCount(view.display);
    }, COUNT_MS + 300);

    return () => {
      cancelAnimationFrame(fillRaf);
      cancelAnimationFrame(countRaf);
      clearTimeout(safety);
    };
  }, [view.display]);

  const settled = count >= view.display;

  return (
    <div className="relative mx-auto w-[220px]">
      <svg viewBox="0 0 200 112" className="w-full">
        <path
          d="M 16 104 A 84 84 0 0 1 184 104"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-secondary"
        />
        <path
          d="M 16 104 A 84 84 0 0 1 184 104"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${fill} 100`}
          stroke="currentColor"
          className={`${TONE_STROKE[view.tone]} transition-[stroke-dasharray] duration-[900ms] ease-out`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <p className="text-[44px] leading-none font-extrabold text-foreground tabular-nums">
          {count}
          <span className="text-3xl">%</span>
        </p>
        {/* 라벨 칩은 카운트가 끝나는 순간 떠오른다 */}
        <span
          className={`mt-1 rounded-full px-3 py-1 text-sm font-bold transition-all duration-300 ${
            TONE_CHIP[view.tone]
          } ${settled ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
        >
          {view.label}
        </span>
      </div>
      <div className="mt-1 flex justify-between px-1 text-[10px] font-medium text-muted-foreground">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
};
