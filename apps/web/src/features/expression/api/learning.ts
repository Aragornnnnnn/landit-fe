// 표현 학습 시작 조회 — 대표 질문·정답 문장·강조 (백엔드 ExpressionLearningResponse 미러)
import { api } from '@/shared/api/client';

export interface ExpressionLearning {
  expressionId: number;
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  usageDescription: string;
  representativeQuestionText: string | null;
  representativeQuestionTranslation: string | null;
  representativeSentenceText: string;
  representativeSentenceTranslation: string;
  highlightingPart: string | null;
  representativeImageUrl: string | null;
}

export const getExpressionLearning = (expressionId: number) =>
  api.get<ExpressionLearning>(
    `/api/v1/expressions/${expressionId}/learning-start`,
  );
