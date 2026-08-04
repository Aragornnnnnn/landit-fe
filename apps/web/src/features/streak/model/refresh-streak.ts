// 대화를 끝낸 순간 스트릭을 서버에서 미리 받아 둔다 — 화면이 돌아왔을 때 이미 새 숫자여야 한다
// 버리기만 하면 도착해서야 조회가 시작돼 옛 숫자를 먼저 그리고 뒤늦게 바뀐다.
// 늘어난 값을 프론트가 계산하지는 않는다 — 하루 1개가 며칠인지는 서버가 정하는 규칙이라 여기서 또 세면 두 곳이 어긋난다
import type { QueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getCurrentStreak, getStreakCalendar } from '../api/streak';
import { monthOf, todayInSeoul } from '../lib/seoul-date';
import { streakKeys } from './keys';

export const refreshStreakAfterCompletion = (queryClient: QueryClient) => {
  // 캐시 키가 userId를 물고 있다는 건 스트릭 사정이라 부르는 쪽이 알 필요 없다
  const userId = useAuthStore.getState().member?.userId ?? null;
  if (userId === null) return;

  const { year, month } = monthOf(todayInSeoul());

  // 받아 둔 것을 먼저 낡은 것으로 표시해야 아래 미리받기가 실제로 나간다
  void queryClient.invalidateQueries({ queryKey: streakKeys.all });

  // 홈 헤더가 볼 숫자와, 연속 기록 페이지가 열자마자 그릴 이번 달
  void queryClient.prefetchQuery({
    queryKey: streakKeys.current(userId),
    queryFn: getCurrentStreak,
  });
  void queryClient.prefetchQuery({
    queryKey: streakKeys.calendar(userId, year, month),
    queryFn: () => getStreakCalendar(year, month),
  });
};
