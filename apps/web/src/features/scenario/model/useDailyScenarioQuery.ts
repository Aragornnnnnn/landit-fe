// 날짜별 시나리오 조회 상태 — 오늘 카드와 지난 날 카드가 같은 훅을 쓴다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getDailyScenario } from '../api/daily';
import { scenarioKeys } from './keys';

// date를 생략하면 서버가 정한 오늘을 받는다.
// 이전 날 카드를 붙들지 않는다(keepPreviousData 금지) — 날짜를 옮기면 그 자리에 바로 로딩이 떠야 눌린 줄 안다
// enabled를 끄면 조회하지 않는다 — 알람처럼 필요한 사람에게만 부르는 곳을 위해
export const useDailyScenarioQuery = (
  date?: string,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: scenarioKeys.daily(userId, date ?? null),
    queryFn: () => getDailyScenario(date),
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    enabled: enabled && userId !== null,
  });

  return {
    // 놓친 날은 scenario가 null로 온다 — 로딩 중(undefined)과 구분해야 해서 data 자체를 넘긴다
    daily: data ?? null,
    error,
    isLoading: isPending,
    retry: () => void refetch(),
  };
};
