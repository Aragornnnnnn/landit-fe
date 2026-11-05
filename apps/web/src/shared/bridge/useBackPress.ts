'use client';

// 떠 있는 동안 안드로이드 뒤로가기를 이 화면의 동작으로 받는 훅
import { useEffect, useEffectEvent } from 'react';

import { registerBackPress } from './back-press';

export const useBackPress = (onBackPress: () => void, enabled = true) => {
  // 넘겨받는 함수는 대개 인라인이라 렌더마다 바뀐다 — 다시 등록하면 순서가 뒤집히므로 부를 때만 최신 것을 쓴다
  const pressBack = useEffectEvent(onBackPress);
  useEffect(() => {
    if (!enabled) return;
    return registerBackPress(() => pressBack());
  }, [enabled]);
};
