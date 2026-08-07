// 연속 기록 페이지의 달력 상태 — 보고 있는 달, 그 달의 조회, 앞뒤로 넘길 수 있는지
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getStreakCalendar, type CurrentStreakResponse } from '../api/streak';
import { canGoBack, canGoForward, shiftMonth } from '../lib/month-grid';
import type { YearMonth } from '../lib/seoul-date';
import { streakKeys } from './keys';

export const useStreakCalendar = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();
  // null = 아직 아무 달도 고르지 않았다. 첫 조회의 달은 서버가 정한다
  const [view, setView] = useState<YearMonth | null>(null);

  // 지나간 달의 기록은 더 늘지 않는다 — 오갈 때마다 다시 부르지 않는다.
  // 오늘이 며칟날인지는 앞선 응답이 심어 둔 값에서 본다 (없으면 첫 조회라 어차피 받아야 한다)
  const knownToday = queryClient.getQueryData<CurrentStreakResponse>(
    streakKeys.current(userId),
  )?.today;
  const isPastMonth =
    view !== null && knownToday !== undefined && canGoForward(view, knownToday);

  const { data, error, refetch, isPlaceholderData } = useQuery({
    queryKey: streakKeys.calendar(userId, view),
    queryFn: async () => {
      const calendar = await getStreakCalendar(view);
      // 달력 응답이 헤더가 쓰는 세 값을 이미 담고 있다 — 심어 두면 홈으로 돌아갈 때 다시 안 부른다
      queryClient.setQueryData(streakKeys.current(userId), {
        currentStreakDays: calendar.currentStreakDays,
        activeToday: calendar.activeToday,
        today: calendar.today,
      });
      // 서버가 고른 달을 그 달의 키에도 심는다 — 다른 달을 보다 돌아올 때 같은 응답을 두 번 받지 않게
      if (view === null) {
        queryClient.setQueryData(
          streakKeys.calendar(userId, {
            year: calendar.year,
            month: calendar.month,
          }),
          calendar,
        );
      }
      return calendar;
    },
    enabled: userId !== null,
    staleTime: isPastMonth ? Infinity : undefined,
    // 달을 넘기는 동안 이전 달을 그대로 두어 화면이 비었다 다시 차오르지 않게 한다
    placeholderData: (previous) => previous,
  });

  // 아직 달을 안 골랐으면 서버가 준 달이 곧 보고 있는 달이다
  const shown = data ? { year: data.year, month: data.month } : null;
  const current = view ?? shown;

  const goMonth = (direction: -1 | 1) => {
    if (current === null) return;
    setView(shiftMonth(current, direction));
  };

  return {
    calendar: data ?? null,
    // 요청한 달과 그리고 있는 달이 다르다 = 다음 달을 받아오는 중
    isSwitching: isPlaceholderData,
    error,
    // 앞은 이번 달까지, 뒤는 첫 완료일이 있는 달까지
    canGoForward:
      current !== null &&
      data !== undefined &&
      canGoForward(current, data.today),
    canGoBack:
      current !== null && canGoBack(current, data?.firstActiveDate ?? null),
    goMonth,
    retry: () => void refetch(),
  };
};
