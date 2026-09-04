// 표현 추가 예문 + 복습 퀴즈 조회 (백엔드 ExpressionPracticeResponse 미러)
import { api } from '@/shared/api/client';

// 눈으로 익히는 예문 — 문제로 나오지 않는다
export interface PracticeSentence {
  sentenceText: string;
  highlightingPart: string;
  sentenceTranslation: string;
  practiceQuestion: string;
  practiceQuestionTranslation: string;
  // 예문 이미지 — 없으면 null (BE가 예문마다 다시 붙이기로 함)
  imageUrl: string | null;
}

// 출제 언어 — EN이면 영어 문장을, KR이면 한국어 해석을 조립한다
export type QuizLanguage = 'EN' | 'KR';

export interface WritingSentence {
  quizLanguage: QuizLanguage;
  writingSentenceText: string;
  writingSentenceTranslation: string;
  writingQuestion: string;
  writingQuestionTranslation: string;
  // 정답을 단어 단위로 나눈 배열(정답 순서)과, 정답+오답을 섞은 선택지 배열(BE 저장 순서).
  // 담긴 언어는 quizLanguage를 따른다
  writingSentenceWords: string[];
  writingSentenceWordChoices: string[];
}

export interface ExpressionPractice {
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  usageDescription: string;
  // 눈으로 익히는 예문 2건
  practiceSentence: PracticeSentence[];
  // 직접 푸는 작문 문제 2건 — 영어·한국어 한 건씩, 순서는 BE 셔플 그대로
  writingSentence: WritingSentence[];
}

export const getExpressionPractice = (expressionId: number) =>
  api.get<ExpressionPractice>(`/api/v1/expressions/${expressionId}/practice`);
