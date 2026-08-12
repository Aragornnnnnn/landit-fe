// 표현 학습 완료 처리 — 완료 후 표현 목록(다음 표현 해금)과 시나리오 목록(다음 대화 해금)을 무효화한다
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { scenarioKeys } from '@/features/scenario/model/keys';
// 스몰톡 표현의 완료 여부는 그 대화의 세션 상세가 들고 있다 — 목록 주인이 둘이라 양쪽을 다 턴다
import { smallTalkKeys } from '@/features/small-talk/model/keys';

import { finishExpression } from '../api/finish';
import { expressionKeys } from './keys';

export const useFinishExpressionMutation = (expressionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => finishExpression(expressionId),
    onSuccess: () => {
      // 전역 staleTime(30s)이 있어 명시적 무효화가 없으면 stale locked가 남는다
      void queryClient.invalidateQueries({ queryKey: expressionKeys.all });
      void queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
      void queryClient.invalidateQueries({ queryKey: smallTalkKeys.all });
    },
  });
};
