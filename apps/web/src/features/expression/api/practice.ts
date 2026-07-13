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
  // 듀오링고식 단어조립 퀴즈용 — answerWords는 정답 순서, shuffledWords는 정답+허위매물이 BE에서 이미 섞인 뱅크
  answerWords: string[];
  shuffledWords: string[];
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
