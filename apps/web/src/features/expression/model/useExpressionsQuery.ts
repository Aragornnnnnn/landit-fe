// 시나리오별 표현 목록 상태 — 표현 리스트 화면
import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getExpressions } from '../api/list';
import { expressionKeys } from './keys';

export const useExpressionsQuery = (scenarioId: number) => {
  const userId = useCurrentUserId();

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
