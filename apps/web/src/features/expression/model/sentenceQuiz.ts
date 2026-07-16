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

// 복습 영작 문제(practice.writingSentence)를 입력 퀴즈 형태로 변환한다.
// BE가 단어 배열을 따로 주지 않아 문장을 직접 쪼갠다 — 가장자리 문장부호는 떼고
// 아포스트로피(can't)는 남겨, learning-start 단어뱅크와 같은 규칙을 따른다.
// 복습은 타이핑 입력이라 단어뱅크(shuffledWords)를 쓰지 않는다.
export const fromWritingSentence = (
  writing: WritingSentence,
): SentenceQuiz => ({
  writingQuestion: writing.writingQuestion,
  writingQuestionTranslation: writing.writingQuestionTranslation,
  writingSentenceText: writing.writingSentenceText,
  writingSentenceTranslation: writing.writingSentenceTranslation,
  answerWords: writing.writingSentenceText
    .split(/\s+/)
    .map((word) => word.replace(/^[.,!?;:"“”]+|[.,!?;:"“”]+$/g, ''))
    .filter((word) => word.length > 0),
  shuffledWords: [],
});
