// 연속 기록 페이지의 달력 상태 — 보고 있는 달, 그 달의 조회, 앞뒤로 넘길 수 있는지
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getStreakCalendar } from '../api/streak';
import { canGoBack, canGoForward, shiftMonth } from '../lib/month-grid';
import { monthOf, todayInSeoul } from '../lib/seoul-date';
import { streakKeys } from './keys';

export const useStreakCalendar = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  // 렌더 중 한 번 읽어 이 화면이 사는 동안 오늘을 고정한다 — 자정을 넘겨도 화면이 스스로 뒤틀리지 않는다
  const [today] = useState(todayInSeoul);
  const [view, setView] = useState(() => monthOf(today));

  const { data, error, isPending, refetch } = useQuery({
    queryKey: streakKeys.calendar(userId, view.year, view.month),
    queryFn: () => getStreakCalendar(view.year, view.month),
    enabled: userId !== null,
    // 달을 넘기는 동안 이전 달을 그대로 두어 화면이 비었다 다시 차오르지 않게 한다
    placeholderData: (previous) => previous,
    refetchOnMount: 'always',
  });

  const goMonth = (direction: -1 | 1) => {
    setView((current) => shiftMonth(current, direction));
  };

  return {
    today,
    view,
    calendar: data ?? null,
    error,
    isLoading: isPending,
    // 앞은 이번 달까지, 뒤는 첫 완료일이 있는 달까지
    canGoForward: canGoForward(view, today),
    canGoBack: canGoBack(view, data?.streakStartedDate ?? null),
    goMonth,
    retry: () => void refetch(),
  };
};
