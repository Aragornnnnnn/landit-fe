'use client';

// 첫 표현 투어의 마지막 — 페이월이 떴으면 투어를 끝낸 것으로 남긴다. 그 뒤로는 다시 뜨지 않는다
import { useEffect, useRef } from 'react';

import { useFirstExpressionTour } from '../../_model/useFirstExpressionTour';

export const TourCompletion = () => {
  const tour = useFirstExpressionTour();
  const saved = useRef(false);
  const { eligible, step, saveStep } = tour;

  useEffect(() => {
    if (!eligible || step === 'COMPLETED' || saved.current) return;
    saved.current = true;
    saveStep('COMPLETED');
  }, [eligible, step, saveStep]);

  return null;
};
