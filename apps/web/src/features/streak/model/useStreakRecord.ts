// 누적 기록(총 완료 일수·최고 연속) — 완료 순간에 미리 받아 둔 달력에서 읽기만 한다
// enabled를 끈 건 여기서 새로 부르지 않겠다는 뜻이다. 축하 화면이 응답을 기다리면 연출이 늦어진다.
// 아직 없으면 null — 모른다는 것과 0이라는 것은 다르다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getStreakCalendar } from '../api/streak';
import { streakKeys } from './keys';

export const useStreakRecord = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data } = useQuery({
    queryKey: streakKeys.calendar(userId, null),
    queryFn: () => getStreakCalendar(null),
    enabled: false,
  });

  return {
    totalActiveDays: data?.totalActiveDays ?? null,
    longestStreakDays: data?.longestStreakDays ?? null,
  };
};
