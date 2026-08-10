// 표현 추가 예문 + 복습 퀴즈 조회 (백엔드 ExpressionPracticeResponse 미러)
import { api } from '@/shared/api/client';

export interface PracticeSentence {
  sentenceText: string;
  highlightingPart: string;
  sentenceTranslation: string;
  practiceQuestion: string;
  practiceQuestionTranslation: string;
  imageUrl: string | null;
}

export interface WritingSentence {
  writingSentenceText: string;
  writingSentenceTranslation: string;
  writingQuestion: string;
  writingQuestionTranslation: string;
  // 정답 문장을 단어 단위로 나눈 배열(정답 순서)과, 정답+오답을 섞은 선택지 배열(BE 저장 순서)
  writingSentenceWords: string[];
  writingSentenceWordChoices: string[];
}

export interface ExpressionPractice {
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  usageDescription: string;
  practiceSentence: PracticeSentence[];
  writingSentence: WritingSentence;
}

export const getExpressionPractice = (expressionId: number) =>
  api.get<ExpressionPractice>(`/api/v1/expressions/${expressionId}/practice`);
