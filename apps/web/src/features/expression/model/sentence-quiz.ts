// 대표 예문(learning-start)·영작 문제(practice)를 단어 선택 퀴즈가 쓰는 형태로 변환한다
import type { ExpressionLearning } from '../api/learning';
import type { WritingSentence } from '../api/practice';

// 퀴즈 UI는 출제 언어를 모른다 — 보여줄 문장(promptText)과 조립할 문장(answerText)만 받는다
export interface SentenceQuiz {
  writingQuestion: string;
  writingQuestionTranslation: string;
  // 내 말풍선에 미리 보여주는 문장 — 이걸 다른 언어로 옮기는 게 문제다
  promptText: string;
  // 조립해야 하는 정답 문장 — 결과 시트에 보여준다
  answerText: string;
  // answerWords는 정답 순서, shuffledWords는 정답+오답이 BE에서 이미 섞인 뱅크
  answerWords: string[];
  shuffledWords: string[];
}

// 대표 질문은 BE에서 null일 수 있어(질문형 구성 불가 시) 빈 문자열로 채운다.
export const fromLearning = (learning: ExpressionLearning): SentenceQuiz => ({
  writingQuestion: learning.representativeQuestionText ?? '',
  writingQuestionTranslation: learning.representativeQuestionTranslation ?? '',
  promptText: learning.representativeSentenceTranslation,
  answerText: learning.representativeSentenceText,
  answerWords: learning.representativeSentenceWords,
  shuffledWords: learning.representativeSentenceWordChoices,
});

// 복습 영작 문제(practice.writingSentence)를 단어 선택 퀴즈 형태로 변환한다.
// EN은 해석을 보고 영어를 조립하고, KR은 영어를 보고 해석을 조립한다 — 단어뱅크는 BE가 출제 언어에 맞춰 준다
export const fromWritingSentence = (writing: WritingSentence): SentenceQuiz => {
  const english = writing.quizLanguage === 'EN';
  return {
    writingQuestion: writing.writingQuestion,
    writingQuestionTranslation: writing.writingQuestionTranslation,
    promptText: english
      ? writing.writingSentenceTranslation
      : writing.writingSentenceText,
    answerText: english
      ? writing.writingSentenceText
      : writing.writingSentenceTranslation,
    answerWords: writing.writingSentenceWords,
    shuffledWords: writing.writingSentenceWordChoices,
  };
};
