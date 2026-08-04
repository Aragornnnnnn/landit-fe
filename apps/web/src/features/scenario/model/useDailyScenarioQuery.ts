// 날짜별 시나리오 조회 상태 — 오늘 카드와 지난 날 카드가 같은 훅을 쓴다
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getDailyScenario } from '../api/daily';
import { scenarioKeys } from './keys';

// date를 생략하면 서버가 정한 오늘을 받는다
export const useDailyScenarioQuery = (date?: string) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: scenarioKeys.daily(userId, date ?? null),
    queryFn: () => getDailyScenario(date),
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    // 날짜를 옮기는 동안 이전 카드를 그대로 둔다 — 비우면 스켈레톤이 한 번 깜빡인다
    placeholderData: keepPreviousData,
    enabled: userId !== null,
  });

  return {
    // 놓친 날은 scenario가 null로 온다 — 로딩 중(undefined)과 구분해야 해서 data 자체를 넘긴다
    daily: data ?? null,
    error,
    isLoading: isPending,
    retry: () => void refetch(),
  };
};
