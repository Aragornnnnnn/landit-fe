'use client';

// 숫자 올라가는 연출 — 화면에 들어오면 0에서 목표 숫자까지 오른다. 검색엔진·화면 낭독기는 처음부터 실제 숫자를 읽고, 자리를 미리 잡아 두어 오르는 동안 옆 요소가 흔들리지 않는다
import { useEffect, useState } from 'react';

import { useInView } from '@/shared/lib/useInView';

import { countUpFrame } from '../_model/count-up';

const DURATION_MS = 1400;

export const CountUp = ({ value }: { value: string }) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(() => countUpFrame(value, 0));

  useEffect(() => {
    if (!inView) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = reduced ? 1 : (now - start) / DURATION_MS;
      setShown(countUpFrame(value, progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref} className="inline-grid tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {value}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1">
        {shown}
      </span>
    </span>
  );
};
