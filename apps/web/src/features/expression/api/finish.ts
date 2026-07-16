// 표현 학습 완료 처리 — 성공 시 다음 표현이 해금된다 (POST, 응답 data 없음)
import { api } from '@/shared/api/client';

export const finishExpression = (expressionId: number) =>
  api.post<Record<string, unknown>>(
    `/api/v1/expressions/${expressionId}/learning-finish`,
  );
