// 종료 의사 확인 게이트 — 상대가 작별 인사를 알아채면 시트를 띄우고, 사용자가 고를 때까지 기다린다.
// 기다림을 약속(promise)으로 돌려주므로 제출 흐름을 끊지 않고 그 자리에서 이어붙일 수 있다
'use client';

import { useRef, useState } from 'react';

import type { FreeTalkExitDecision } from '@/features/small-talk/api/free-talk';

export const useExitDecision = () => {
  const [asking, setAsking] = useState(false);
  const answerRef = useRef<((decision: FreeTalkExitDecision) => void) | null>(
    null,
  );

  // 시트를 띄우고 답을 기다린다 — 이미 묻는 중이면 앞선 기다림은 버려진다(서버가 한 번에 하나만 묻는다)
  const ask = () =>
    new Promise<FreeTalkExitDecision>((resolve) => {
      answerRef.current = resolve;
      setAsking(true);
    });

  const answer = (decision: FreeTalkExitDecision) => {
    setAsking(false);
    answerRef.current?.(decision);
    answerRef.current = null;
  };

  return { asking, ask, answer };
};
