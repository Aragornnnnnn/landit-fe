// 표현 학습 완료 처리 — 성공 시 다음 표현이 해금된다 (POST, 응답 data 없음)
import { api } from '@/shared/api/client';

// 스몰톡 표현은 서버가 세션 연결을 검증해야 완료를 기록한다 — 시나리오 표현은 바디 없이 보낸다
export const finishExpression = (
  expressionId: number,
  freeTalkSessionId?: number,
) => {
  const path = `/api/v1/expressions/${expressionId}/learning-finish`;
  return freeTalkSessionId === undefined
    ? api.post<Record<string, unknown>>(path)
    : api.post<Record<string, unknown>>(path, { freeTalkSessionId });
};
