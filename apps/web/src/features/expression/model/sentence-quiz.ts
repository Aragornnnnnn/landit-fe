// 대표 예문(learning-start)·영작 문제(practice)를 단어 선택/입력 퀴즈가 쓰는 형태로 변환한다
import type { ExpressionLearning } from '../api/learning';
import type { WritingSentence } from '../api/practice';

export interface SentenceQuiz {
  writingQuestion: string;
  writingQuestionTranslation: string;
  writingSentenceText: string;
  writingSentenceTranslation: string;
  // answerWords는 정답 순서, shuffledWords는 정답+오답이 BE에서 이미 섞인 뱅크
  answerWords: string[];
  shuffledWords: string[];
}

// 대표 질문은 BE에서 null일 수 있어(질문형 구성 불가 시) 빈 문자열로 채운다.
export const fromLearning = (learning: ExpressionLearning): SentenceQuiz => ({
  writingQuestion: learning.representativeQuestionText ?? '',
  writingQuestionTranslation: learning.representativeQuestionTranslation ?? '',
  writingSentenceText: learning.representativeSentenceText,
  writingSentenceTranslation: learning.representativeSentenceTranslation,
  answerWords: learning.representativeSentenceWords,
  shuffledWords: learning.representativeSentenceWordChoices,
});

// 복습 영작 문제(practice.writingSentence)를 단어 선택 퀴즈 형태로 변환한다.
// learning-start와 같은 규칙 — BE가 준 단어뱅크(정답 순서 words, 섞인 선택지 wordChoices)를 그대로 옮긴다.
export const fromWritingSentence = (
  writing: WritingSentence,
): SentenceQuiz => ({
  writingQuestion: writing.writingQuestion,
  writingQuestionTranslation: writing.writingQuestionTranslation,
  writingSentenceText: writing.writingSentenceText,
  writingSentenceTranslation: writing.writingSentenceTranslation,
  answerWords: writing.writingSentenceWords,
  shuffledWords: writing.writingSentenceWordChoices,
});
