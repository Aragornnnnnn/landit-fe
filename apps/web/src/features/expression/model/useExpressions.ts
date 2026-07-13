// 시나리오별 표현 목록 상태 — 표현 리스트 화면
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/store/auth-store';

import { getExpressions } from '../api/list';
import { expressionKeys } from './keys';

export const useExpressions = (scenarioId: number) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: expressionKeys.list(userId, scenarioId),
    queryFn: () => getExpressions(scenarioId),
    enabled: userId !== null,
  });

  return {
    expressions: data ?? null,
    error,
    isLoading: isPending,
    retry: () => void refetch(),
  };
};
