// 시나리오 기록 조회 상태 — 목록과 회차 화면이 같은 응답을 나눠 쓴다(회차 화면은 추가 요청이 없다)
import { useQuery } from '@tanstack/react-query';

import { scenarioKeys } from '@/features/scenario/model/keys';
import { useAuthStore } from '@/shared/auth/auth-store';

import { getScenarioHistory } from '../_api/scenario-history';

export const useScenarioHistoryQuery = (scenarioId: number) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, refetch, isFetching } = useQuery({
    queryKey: scenarioKeys.history(userId, scenarioId),
    queryFn: () => getScenarioHistory(scenarioId),
    // 끝난 회차는 바뀌지 않는다 — 회차마다 대화 전부가 실려 무거우니 오갈 때마다 다시 받지 않는다.
    // 새 회차는 대화를 마칠 때 scenarioKeys.all 무효화가, 결제 뒤 잠긴 기록은 회차 화면의 다시 받기가 맡는다
    staleTime: Infinity,
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    enabled: userId !== null,
  });

  return {
    sessions: data?.sessions ?? null,
    error,
    retry: () => void refetch(),
    // 받아 둔 것을 다시 받는 중 — 잠긴 기록을 결제 뒤 갈아끼울 때. 그동안 잠긴 문을 열지 않는다
    isRefreshing: data !== undefined && isFetching,
  };
};
