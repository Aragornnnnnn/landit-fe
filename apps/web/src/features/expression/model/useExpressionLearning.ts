// 표현 학습 시작 상세(대표 예문·단어뱅크) — 단어 선택 퀴즈·복습 영작 스텝에서 쓴다
import { useQuery } from '@tanstack/react-query';

import { getExpressionLearning } from '../api/learning';
import { expressionKeys } from './keys';

export const useExpressionLearning = (expressionId: number) => {
  const { data, error, isPending } = useQuery({
    queryKey: expressionKeys.learning(expressionId),
    queryFn: () => getExpressionLearning(expressionId),
    staleTime: Infinity,
  });

  return { learning: data ?? null, error, isLoading: isPending };
};
