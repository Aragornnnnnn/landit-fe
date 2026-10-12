'use client';

// 지금 로그인한 사람에게 "받을 수 있었던 금액" 표시가 있는지 지켜본다
import { useSyncExternalStore } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';

import { hasMissedEarn, subscribeMissedEarn } from './missed-earn';

export const useMissedEarn = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  return useSyncExternalStore(
    subscribeMissedEarn,
    () => userId !== null && hasMissedEarn(userId),
    () => false,
  );
};
