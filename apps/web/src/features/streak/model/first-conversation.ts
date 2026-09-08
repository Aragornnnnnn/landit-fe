// 방금 끝낸 대화가 생애 첫 완료였는지 — 완료 순간 refreshStreakAfterCompletion이 심어 둔 값을 읽는다.
// true 첫 대화 / false 아님 / null 모름(달력을 받은 적 없음)
import type { QueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { streakKeys } from './keys';

export const readFirstConversationBase = (
  queryClient: QueryClient,
): boolean | null => {
  const userId = useAuthStore.getState().member?.userId ?? null;
  if (userId === null) return null;
  return (
    queryClient.getQueryData<boolean | null>(
      streakKeys.firstConversationBase(userId),
    ) ?? null
  );
};
