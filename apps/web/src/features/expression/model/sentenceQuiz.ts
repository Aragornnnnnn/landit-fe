// 대표 예문(learning-start)을 단어 선택/입력 퀴즈가 쓰는 형태로 변환한다 — QUIZ·REVIEW 스텝 공용
import type { ExpressionLearning } from '../api/learning';

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
