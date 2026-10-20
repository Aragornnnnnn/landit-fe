// 스트릭 조회의 키·요청 묶음 — 화면의 조회와 완료 순간의 미리받기가 같은 묶음을 써야 캐시가 하나로 맞는다
import { queryOptions } from '@tanstack/react-query';

import { getCurrentStreak, getStreakCalendar } from '../api/streak';
import type { YearMonth } from '../lib/year-month';
import { streakKeys } from './keys';

export const streakQueries = {
  current: (userId: number | null) =>
    queryOptions({
      queryKey: streakKeys.current(userId),
      queryFn: getCurrentStreak,
    }),
  // view를 주면 그 달을, null이면 서버가 고른 이번 달을 읽는다
  calendar: (userId: number | null, view: YearMonth | null) =>
    queryOptions({
      queryKey: streakKeys.calendar(userId, view),
      queryFn: () => getStreakCalendar(view),
    }),
};
