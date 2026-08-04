// 헤더용 현재 스트릭 조회 — 열매 상태와 일수만 필요하므로 가벼운 /me/streak를 쓴다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getCurrentStreak } from '../api/streak';
import { streakKeys } from './keys';

export const useStreakQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data } = useQuery({
    queryKey: streakKeys.current(userId),
    queryFn: getCurrentStreak,
    enabled: userId !== null,
    // 대화를 끝내고 홈으로 돌아오면 탭 레이아웃째 리마운트된다 — 그때 다시 조회해 방금 채운 오늘이 바로 보이게 한다
    refetchOnMount: 'always',
    // 조회가 실패해도 홈은 그대로 돌아야 하므로 에러는 밖으로 내보내지 않는다
    retry: 1,
  });

  return data ?? null;
};
