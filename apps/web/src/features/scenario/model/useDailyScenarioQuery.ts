// 오늘의 시나리오 조회 상태
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getDailyScenario } from '../api/daily';
import { scenarioKeys } from './keys';

export const useDailyScenarioQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: scenarioKeys.daily(userId),
    queryFn: getDailyScenario,
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    enabled: userId !== null,
  });

  return {
    // 배정이 없으면 scenario가 null로 온다 — 로딩 중(undefined)과 구분해야 해서 응답 자체를 넘긴다
    daily: data ?? null,
    error,
    isLoading: isPending,
    retry: () => void refetch(),
  };
};
