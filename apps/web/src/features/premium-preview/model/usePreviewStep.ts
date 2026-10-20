'use client';

// 내 프리뷰 단계를 지켜본다 — 저장하면 지켜보는 화면이 곧바로 다시 그린다. 로그인 전·서버 렌더에서는 시작 전이다
import { useSyncExternalStore } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';

import type { PreviewStep } from './preview-step';
import {
  readPreviewStep,
  subscribePreviewStep,
  writePreviewStep,
} from './preview-store';

const notStartedOnServer = () => null;

export const usePreviewStep = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const step = useSyncExternalStore(
    subscribePreviewStep,
    () => (userId === null ? null : readPreviewStep(userId)),
    notStartedOnServer,
  );
  return {
    step,
    saveStep: (next: PreviewStep) => {
      if (userId !== null) writePreviewStep(userId, next);
    },
  };
};
