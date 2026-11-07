'use client';

// 녹음하는 동안 진동을 막고 푸는 훅 — 녹음 경로(음성 인식·발음 녹음)가 같이 쓰고, 화면을 떠나면 꼭 푼다
import { useEffect, useRef } from 'react';

import { muteHaptics } from './haptics';

export const useHapticsMute = () => {
  const unmuteRef = useRef<(() => void) | null>(null);

  // 이미 막아 둔 채로 또 불러도 한 번만 막는다 — 한 번 풀면 다시 울려야 한다
  const mute = () => {
    unmuteRef.current ??= muteHaptics();
  };

  const unmute = () => {
    unmuteRef.current?.();
    unmuteRef.current = null;
  };

  // 막아 둔 채 화면을 떠나면 진동이 앱 전체에서 막힌 채 남는다
  useEffect(
    () => () => {
      unmuteRef.current?.();
      unmuteRef.current = null;
    },
    [],
  );

  return { mute, unmute };
};
