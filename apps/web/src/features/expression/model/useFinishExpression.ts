// 표현 학습 완료 처리 — 완료 후 해당 시나리오 표현 목록을 무효화해 해금 반영
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { finishExpression } from '../api/finish';
import { expressionKeys } from './keys';

export const useFinishExpression = (expressionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => finishExpression(expressionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expressionKeys.all });
    },
  });
};
