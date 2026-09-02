'use client';

// 누른 것을 잠깐 보여준 뒤 다음으로 넘긴다 — 단일 선택·척도처럼 고르는 순간 끝나는 문항이 쓴다.
// 바로 넘기면 뭘 골랐는지 못 보고, 두 번 눌리면 두 번 넘어가니 첫 누름만 받는다
import { useEffect, useRef } from 'react';

const SHOW_PRESSED_MS = 160;

export const useAdvanceAfterPress = (onNext: () => void) => {
  // 타이머가 걸려 있다 = 이미 눌렀다. 화면이 사라지면 타이머도 지운다
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const pressAndAdvance = (record: () => void) => {
    if (timer.current !== null) return;
    record();
    timer.current = window.setTimeout(onNext, SHOW_PRESSED_MS);
  };

  return pressAndAdvance;
};
