// 대화를 끝낸 순간 스트릭을 서버에서 미리 받아 둔다 — 화면이 돌아왔을 때 이미 새 숫자여야 한다
// 버리기만 하면 도착해서야 조회가 시작돼 옛 숫자를 먼저 그리고 뒤늦게 바뀐다.
// 늘어난 값을 프론트가 계산하지는 않는다 — 하루 1개가 며칠인지는 서버가 정하는 규칙이라 여기서 또 세면 두 곳이 어긋난다
import type { QueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  getCurrentStreak,
  getStreakCalendar,
  type CurrentStreakResponse,
} from '../api/streak';
import type { StreakBase } from './celebration';
import { streakKeys } from './keys';

export const refreshStreakAfterCompletion = (queryClient: QueryClient) => {
  // 캐시 키가 userId를 물고 있다는 건 스트릭 사정이라 부르는 쪽이 알 필요 없다
  const userId = useAuthStore.getState().member?.userId ?? null;
  if (userId === null) return;

  // 버리기 전에 집어둔다 — 여기 남아 있는 게 곧 대화에 들어갈 때 알던 값이고,
  // 축하 화면은 그때 오늘이 아직이었을 때만 열매가 찍히는 연출을 켠다
  const previous = queryClient.getQueryData<CurrentStreakResponse>(
    streakKeys.current(userId),
  );

  // 받아 둔 것을 먼저 낡은 것으로 표시해야 아래 미리받기가 실제로 나간다
  void queryClient.invalidateQueries({ queryKey: streakKeys.all });

  // 집어둔 값은 무효화 뒤에 심는다 — 조회 결과가 아니라 이번 완료를 설명하는 값이라 같이 버려지면 안 된다
  const celebrationBase: StreakBase | null = previous
    ? { activeToday: previous.activeToday }
    : null;
  queryClient.setQueryData(streakKeys.celebrationBase(userId), celebrationBase);

  // 홈 헤더가 볼 숫자와, 연속 기록 페이지가 열자마자 그릴 달.
  // 어느 달인지는 서버가 정한다 — 연속 기록 페이지도 같은 키로 연다
  void queryClient.prefetchQuery({
    queryKey: streakKeys.current(userId),
    queryFn: getCurrentStreak,
  });
  void queryClient.prefetchQuery({
    queryKey: streakKeys.calendar(userId, null),
    queryFn: () => getStreakCalendar(null),
  });
};
