'use client';

// 내 투어 단계를 지켜본다 — 저장하면 지켜보는 화면이 곧바로 다시 그린다. 로그인 전·서버 렌더에서는 시작 전이다
import { useSyncExternalStore } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';

import type { TourStep } from './tour-step';
import { readTourStep, subscribeTourStep, writeTourStep } from './tour-store';

const notStartedOnServer = () => null;

export const useTourStep = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const step = useSyncExternalStore(
    subscribeTourStep,
    () => (userId === null ? null : readTourStep(userId)),
    notStartedOnServer,
  );
  return {
    step,
    saveStep: (next: TourStep) => {
      if (userId !== null) writeTourStep(userId, next);
    },
  };
};
