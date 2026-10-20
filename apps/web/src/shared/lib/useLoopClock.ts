// 데모 장면 시계 — 장면마다 정해진 시간만큼 머물다 다음으로, 끝나면 처음으로 돌아간다.
// 멈춰 있으면 마지막(완성된) 장면을 준다. rAF가 아니라 타이머라 웹뷰에서 프레임이 멎어도 장면은 넘어간다 (LAN-375)
import { useEffect, useState } from 'react';

import { prefersReducedMotion } from './reduced-motion';

export const useLoopClock = (
  durations: readonly number[],
  running: boolean,
) => {
  // 시작부터 넘어간 장면 수 — 장면 번호와 바퀴 수는 여기서 나눠 구한다
  const [ticks, setTicks] = useState(0);
  // 동작 줄이기를 켠 기기에선 돌지 않고 완성된 장면에 머문다
  const [reduced] = useState(prefersReducedMotion);
  const playing = running && !reduced;
  const count = durations.length;

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(
      () => setTicks((previous) => previous + 1),
      durations[ticks % count],
    );
    return () => clearTimeout(timer);
  }, [playing, ticks, durations, count]);

  if (!playing) return { step: count - 1, loop: 0 };
  return { step: ticks % count, loop: Math.floor(ticks / count) };
};
