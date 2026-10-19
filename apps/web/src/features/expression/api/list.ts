// 시나리오별 원어민 표현 목록 조회 — 표현 리스트 화면 (백엔드 ExpressionResponse[] 미러)
import { api } from '@/shared/api/client';

export interface Expression {
  expressionId: number;
  displayOrder: number;
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  completed: boolean;
  locked: boolean;
  // 무료 사용자에게 서버가 열어 준 체험 표현(사용자당 하나, landit-be #308). 구버전 응답엔 없다
  freeTrial?: boolean;
}

export const getExpressions = (scenarioId: number) =>
  api.get<Expression[]>(`/api/v1/expressions/${scenarioId}`);
