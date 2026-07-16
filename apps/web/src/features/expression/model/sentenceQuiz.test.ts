// 대표 예문 → 퀴즈 변환 검증 — 단어뱅크 필드가 learning-start에서 제대로 옮겨오는지
import { describe, expect, it } from 'vitest';

import type { ExpressionLearning } from '../api/learning';
import type { WritingSentence } from '../api/practice';
import { fromLearning, fromWritingSentence } from './sentenceQuiz';

const baseLearning: ExpressionLearning = {
  expressionId: 101,
  targetExpressionText: 'blow my mind',
  baseExpressionMeaningText: '끝내주게 놀랍다',
  usageDescription: '강렬한 인상을 받았을 때 쓰는 표현',
  representativeQuestionText: 'What should I see in Korea?',
  representativeQuestionTranslation: '한국에서 뭘 봐야 해?',
  representativeSentenceText: 'Gyeongbokgung Palace will blow your mind.',
  representativeSentenceTranslation: '경복궁은 널 완전 놀라게 할 거야.',
  representativeSentenceWords: [
    'Gyeongbokgung',
    'Palace',
    'will',
    'blow',
    'your',
    'mind',
  ],
  representativeSentenceWordChoices: [
    'blow',
    'mind',
    'Palace',
    'will',
    'your',
    'Gyeongbokgung',
    'amazing',
  ],
  representativeImageUrl: null,
};

describe('fromLearning', () => {
  it('대표 예문의 단어뱅크와 질문·문장을 퀴즈 형태로 옮긴다', () => {
    expect(fromLearning(baseLearning)).toEqual({
      writingQuestion: 'What should I see in Korea?',
      writingQuestionTranslation: '한국에서 뭘 봐야 해?',
      writingSentenceText: 'Gyeongbokgung Palace will blow your mind.',
      writingSentenceTranslation: '경복궁은 널 완전 놀라게 할 거야.',
      answerWords: ['Gyeongbokgung', 'Palace', 'will', 'blow', 'your', 'mind'],
      shuffledWords: [
        'blow',
        'mind',
        'Palace',
        'will',
        'your',
        'Gyeongbokgung',
        'amazing',
      ],
    });
  });

  it('대표 질문이 null이면 빈 문자열로 채운다', () => {
    const quiz = fromLearning({
      ...baseLearning,
      representativeQuestionText: null,
      representativeQuestionTranslation: null,
    });

    expect(quiz.writingQuestion).toBe('');
    expect(quiz.writingQuestionTranslation).toBe('');
  });
});

describe('fromWritingSentence', () => {
  const writing: WritingSentence = {
    writingSentenceText: 'The special effects blew my mind.',
    writingSentenceTranslation: '특수효과가 끝내줬어.',
    writingQuestion: 'How was the musical?',
    writingQuestionTranslation: '뮤지컬 어땠어?',
  };

  it('영작 문제의 질문·문장을 옮기고 문장을 단어로 쪼갠다', () => {
    expect(fromWritingSentence(writing)).toEqual({
      writingQuestion: 'How was the musical?',
      writingQuestionTranslation: '뮤지컬 어땠어?',
      writingSentenceText: 'The special effects blew my mind.',
      writingSentenceTranslation: '특수효과가 끝내줬어.',
      answerWords: ['The', 'special', 'effects', 'blew', 'my', 'mind'],
      shuffledWords: [],
    });
  });

  it('단어 가장자리 문장부호는 떼고 아포스트로피는 남긴다(BE 단어뱅크 규칙과 동일)', () => {
    const quiz = fromWritingSentence({
      ...writing,
      writingSentenceText: "Wow, I can't wait!",
    });
    expect(quiz.answerWords).toEqual(['Wow', 'I', "can't", 'wait']);
  });

  it('연속 공백이 있어도 빈 단어를 만들지 않는다', () => {
    const quiz = fromWritingSentence({
      ...writing,
      writingSentenceText: 'It  was  great.',
    });
    expect(quiz.answerWords).toEqual(['It', 'was', 'great']);
  });
});
