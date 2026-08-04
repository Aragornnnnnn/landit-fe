// 연속 기록 페이지의 달력 상태 — 보고 있는 달, 그 달의 조회, 앞뒤로 넘길 수 있는지
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getStreakCalendar } from '../api/streak';
import { canGoBack, canGoForward, shiftMonth } from '../lib/month-grid';
import { monthOf, todayInSeoul } from '../lib/seoul-date';
import { streakKeys } from './keys';

export const useStreakCalendar = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();
  // 렌더 중 한 번 읽어 이 화면이 사는 동안 오늘을 고정한다 — 자정을 넘겨도 화면이 스스로 뒤틀리지 않는다
  const [today] = useState(todayInSeoul);
  const [view, setView] = useState(() => monthOf(today));

  const { data, error, refetch } = useQuery({
    queryKey: streakKeys.calendar(userId, view.year, view.month),
    queryFn: async () => {
      const calendar = await getStreakCalendar(view.year, view.month);
      // 달력 응답이 헤더가 쓰는 두 값을 이미 담고 있다 — 심어 두면 홈으로 돌아갈 때 다시 안 부른다
      queryClient.setQueryData(streakKeys.current(userId), {
        currentStreakDays: calendar.currentStreakDays,
        activeToday: calendar.activeToday,
      });
      return calendar;
    },
    enabled: userId !== null,
    // 지나간 달의 기록은 더 늘지 않는다 — 오갈 때마다 다시 부르지 않는다
    staleTime: canGoForward(view, today) ? Infinity : undefined,
    // 달을 넘기는 동안 이전 달을 그대로 두어 화면이 비었다 다시 차오르지 않게 한다
    placeholderData: (previous) => previous,
  });

  const goMonth = (direction: -1 | 1) => {
    setView((current) => shiftMonth(current, direction));
  };

  return {
    today,
    view,
    calendar: data ?? null,
    error,
    // 앞은 이번 달까지, 뒤는 첫 완료일이 있는 달까지
    canGoForward: canGoForward(view, today),
    canGoBack: canGoBack(view, data?.streakStartedDate ?? null),
    goMonth,
    retry: () => void refetch(),
  };
};
