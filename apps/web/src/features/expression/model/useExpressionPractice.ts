// 표현 추가 예문 + 복습 영작 문제 — 표현 설명·복습 영작 스텝에서 쓴다
// enabled로 로드 시점을 제어한다 — QUIZ 진입 시 미리 받아 EXPLAIN 도착 전에 데워둔다
// (writingSentence는 서버 랜덤 1개라 staleTime Infinity로 한 번만 받는다)
import { useQuery } from '@tanstack/react-query';

import { getExpressionPractice } from '../api/practice';
import { expressionKeys } from './keys';

export const useExpressionPractice = (
  expressionId: number,
  enabled: boolean,
) => {
  const { data, error, isPending } = useQuery({
    queryKey: expressionKeys.practice(expressionId),
    queryFn: () => getExpressionPractice(expressionId),
    enabled,
    staleTime: Infinity,
  });

  return { practice: data ?? null, error, isLoading: isPending };
};
