'use client';

// 이 대화가 생애 첫 완료가 될지 — 들어올 때의 스트릭 달력에 첫 완료일이 비어 있으면 첫 대화다.
// 완료 직후 스트릭이 갱신되면 첫 완료일이 오늘로 채워져 "첫 대화"를 잃어버리므로,
// 자기 키로 한 번만 받고 대화가 끝날 때까지 갱신하지 않는다
import { useQuery } from '@tanstack/react-query';

import { getStreakCalendar } from '@/features/streak/api/streak';
import { useAuthStore } from '@/shared/auth/auth-store';

/**
 * @param enabled 무료 사용자의 첫 완료일 때만 묻는다 — 재대화·유료는 답이 필요 없다
 * @returns 첫 대화면 true, 아니면 false, 아직 모르면 null
 */
export const useWasFirstConversation = (enabled: boolean): boolean | null => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data } = useQuery({
    queryKey: ['conversation', 'was-first', userId],
    queryFn: () => getStreakCalendar(null),
    enabled: enabled && userId !== null,
    // 대화 중엔 갱신하지 않고, 화면을 떠나면 버린다 — 다음 대화는 새로 판단해야 한다
    staleTime: Infinity,
    gcTime: 0,
    retry: 1,
  });

  return data ? data.firstActiveDate === null : null;
};
