// 헤더용 현재 스트릭 조회 — 열매 상태와 일수만 필요하므로 가벼운 /me/streak를 쓴다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getCurrentStreak } from '../api/streak';
import { streakKeys } from './keys';

export const useStreakQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, isPending } = useQuery({
    queryKey: streakKeys.current(userId),
    queryFn: getCurrentStreak,
    enabled: userId !== null,
    // 조회가 실패해도 홈은 그대로 돌아야 하므로 에러는 밖으로 내보내지 않는다
    retry: 1,
  });

  return {
    streak: data ?? null,
    // 아직 못 받은 것과 받다 실패한 것은 다르다 — 부르는 쪽이 둘을 나눠 그릴 수 있게 한다.
    // 로그인 전에는 쿼리가 돌지 않아 isPending이 계속 참이다. 그건 기다리는 게 아니라 볼 게 없는 것
    isPending: userId !== null && isPending,
  };
};
