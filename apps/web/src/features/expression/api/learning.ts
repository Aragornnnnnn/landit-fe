// 표현 학습 시작 조회 — 대표 질문·정답 문장·단어뱅크 (백엔드 ExpressionLearningResponse 미러)
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
  // 정답 예문을 단어 단위로 나눈 배열(정답 순서)과, 정답+오답을 섞은 선택지 배열(BE 저장 순서)
  representativeSentenceWords: string[];
  representativeSentenceWordChoices: string[];
  representativeImageUrl: string | null;
}

export const getExpressionLearning = (expressionId: number) =>
  api.get<ExpressionLearning>(
    `/api/v1/expressions/${expressionId}/learning-start`,
  );
