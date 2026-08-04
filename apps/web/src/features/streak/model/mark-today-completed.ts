// 대화를 끝낸 순간 스트릭 캐시를 먼저 고쳐 둔다 — 화면이 돌아왔을 때 이미 바뀐 상태여야 한다
// 무효화만 하면 캐시의 옛 숫자를 먼저 그리고 응답이 온 뒤 번쩍인다
import type { QueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import type {
  CurrentStreakResponse,
  StreakCalendarResponse,
} from '../api/streak';
import { todayInSeoul } from '../lib/seoul-date';
import { streakKeys } from './keys';
import {
  calendarWithTodayCompleted,
  withTodayCompleted,
} from './today-completion';

// 캐시 키가 userId를 물고 있다는 건 스트릭 사정이라 부르는 쪽이 알 필요 없다
export const markTodayCompleted = (queryClient: QueryClient) => {
  const userId = useAuthStore.getState().member?.userId ?? null;
  const today = todayInSeoul();

  queryClient.setQueryData<CurrentStreakResponse>(
    streakKeys.current(userId),
    (streak) => (streak ? withTodayCompleted(streak) : streak),
  );

  // 어느 달을 펼쳐 뒀는지 모르므로 받아 둔 달을 전부 고친다 — 오늘이 안 든 달은 요약만 바뀐다
  queryClient.setQueriesData<StreakCalendarResponse>(
    { queryKey: streakKeys.all },
    (calendar) =>
      calendar && 'activeDates' in calendar
        ? calendarWithTodayCompleted(calendar, today)
        : calendar,
  );

  // 미리 고친 값은 어디까지나 예측이다. 서버 값으로 조용히 맞춘다
  void queryClient.invalidateQueries({ queryKey: streakKeys.all });
};
