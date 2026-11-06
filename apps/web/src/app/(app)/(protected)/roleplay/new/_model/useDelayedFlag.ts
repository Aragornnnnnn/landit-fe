// 켜진 상태가 일정 시간 이어질 때만 true가 되고, 꺼지면 바로 false다
'use client';

import { useEffect, useState } from 'react';

export const useDelayedFlag = (on: boolean, delayMs: number) => {
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    if (!on) return;
    const timer = setTimeout(() => setDelayed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setDelayed(false);
    };
  }, [on, delayMs]);
  return on && delayed;
};
