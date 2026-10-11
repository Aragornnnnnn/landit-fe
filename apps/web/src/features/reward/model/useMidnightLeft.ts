'use client';

// 자정(한국 시각)까지 남은 시간을 초마다 알려 준다 — 줄어드는 시계를 그리는 자리에서만 쓴다
import { useEffect, useState } from 'react';

import { msUntilKstMidnight } from './time-left';

export const useMidnightLeft = () => {
  const [left, setLeft] = useState(() => msUntilKstMidnight(Date.now()));

  useEffect(() => {
    const timer = setInterval(
      () => setLeft(msUntilKstMidnight(Date.now())),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  return left;
};
