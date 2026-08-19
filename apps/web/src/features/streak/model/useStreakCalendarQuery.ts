// 스트릭 달력 한 번 읽기 — 서버가 고른 이번 달의 요약(오늘 완료 여부·총 완료일 수)만 필요할 때.
// 완료 직후 refreshStreakAfterCompletion이 같은 키로 미리 받아 둬 보통은 네트워크를 타지 않는다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getStreakCalendar } from '../api/streak';
import { streakKeys } from './keys';

export const useStreakCalendarQuery = ({ enabled }: { enabled: boolean }) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, isError } = useQuery({
    queryKey: streakKeys.calendar(userId, null),
    queryFn: () => getStreakCalendar(null),
    enabled: enabled && userId !== null,
    retry: 1,
  });

  return { calendar: data ?? null, isError };
};
