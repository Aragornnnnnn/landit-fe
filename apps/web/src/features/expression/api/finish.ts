// 표현 학습 완료 처리 — 성공 시 다음 표현이 해금된다 (POST)
// 영수증 모양은 환급 쪽 타입을 그대로 쓴다 — 같은 서버 타입이라 가로 import를 둔다
import type { RewardReceipt } from '@/features/reward/api/reward';
import { api } from '@/shared/api/client';

// 환급 참여자에게는 적립 영수증이 reward로 오고, 그 밖에는 빈 객체다
export interface FinishExpressionResponse {
  reward?: RewardReceipt;
}

// 스몰톡 표현은 서버가 세션 연결을 검증해야 완료를 기록한다 — 시나리오 표현은 바디 없이 보낸다
export const finishExpression = (
  expressionId: number,
  freeTalkSessionId?: number,
) => {
  const path = `/api/v1/expressions/${expressionId}/learning-finish`;
  return freeTalkSessionId === undefined
    ? api.post<FinishExpressionResponse>(path)
    : api.post<FinishExpressionResponse>(path, { freeTalkSessionId });
};
