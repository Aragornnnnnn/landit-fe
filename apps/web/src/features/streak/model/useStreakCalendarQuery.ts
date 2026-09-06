// 스트릭 달력 한 번 읽기 — 서버가 고른 이번 달의 요약(오늘 완료 여부·총 완료일 수)만 필요할 때.
// 완료 직후 refreshStreakAfterCompletion이 같은 키로 미리 받아 둬 보통은 네트워크를 타지 않는다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getStreakCalendar } from '../api/streak';
import type { YearMonth } from '../lib/seoul-date';
import { streakKeys } from './keys';

// view를 주면 그 달을, 생략하면 서버가 고른 이번 달을 읽는다
export const useStreakCalendarQuery = ({
  enabled,
  view = null,
}: {
  enabled: boolean;
  view?: YearMonth | null;
}) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, isError } = useQuery({
    queryKey: streakKeys.calendar(userId, view),
    queryFn: () => getStreakCalendar(view),
    enabled: enabled && userId !== null,
    retry: 1,
  });

  return { calendar: data ?? null, isError };
};
