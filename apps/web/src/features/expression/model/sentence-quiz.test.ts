// 대표 예문·영작 문제 → 퀴즈 변환 검증 — 단어뱅크가 제대로 옮겨오고, 출제 언어에 따라 보여줄 문장과 조립할 문장이 갈리는지
import { describe, expect, it } from 'vitest';

import type { ExpressionLearning } from '../api/learning';
import type { WritingSentence } from '../api/practice';
import { fromLearning, fromWritingSentence } from './sentence-quiz';

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
  completed: false,
  representativeSentenceAudioUrl: null,
  targetExpressionAudioUrl: null,
};

describe('fromLearning', () => {
  it('대표 예문의 단어뱅크와 질문·문장을 퀴즈 형태로 옮긴다', () => {
    expect(fromLearning(baseLearning)).toEqual({
      writingQuestion: 'What should I see in Korea?',
      writingQuestionTranslation: '한국에서 뭘 봐야 해?',
      promptText: '경복궁은 널 완전 놀라게 할 거야.',
      answerText: 'Gyeongbokgung Palace will blow your mind.',
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
    quizLanguage: 'EN',
    writingSentenceText: 'The special effects blew my mind.',
    writingSentenceTranslation: '특수효과가 끝내줬어.',
    writingQuestion: 'How was the musical?',
    writingQuestionTranslation: '뮤지컬 어땠어?',
    writingSentenceWords: ['The', 'special', 'effects', 'blew', 'my', 'mind'],
    writingSentenceWordChoices: [
      'blew',
      'mind',
      'The',
      'my',
      'special',
      'effects',
      'amazing',
    ],
  };

  it('영어 문제(EN)는 해석을 보여주고 영어 문장을 조립한다', () => {
    expect(fromWritingSentence(writing)).toEqual({
      writingQuestion: 'How was the musical?',
      writingQuestionTranslation: '뮤지컬 어땠어?',
      promptText: '특수효과가 끝내줬어.',
      answerText: 'The special effects blew my mind.',
      answerWords: ['The', 'special', 'effects', 'blew', 'my', 'mind'],
      shuffledWords: [
        'blew',
        'mind',
        'The',
        'my',
        'special',
        'effects',
        'amazing',
      ],
    });
  });

  it('한국어 문제(KR)는 영어 문장을 보여주고 해석을 조립한다', () => {
    // given — BE가 단어 배열에 한국어를 담아 준 KR 문제
    const korean: WritingSentence = {
      ...writing,
      quizLanguage: 'KR',
      writingSentenceWords: ['특수효과가', '끝내줬어'],
      writingSentenceWordChoices: ['별로였어', '특수효과가', '끝내줬어'],
    };

    const quiz = fromWritingSentence(korean);

    expect(quiz.promptText).toBe('The special effects blew my mind.');
    expect(quiz.answerText).toBe('특수효과가 끝내줬어.');
    expect(quiz.answerWords).toEqual(['특수효과가', '끝내줬어']);
    expect(quiz.shuffledWords).toEqual(['별로였어', '특수효과가', '끝내줬어']);
  });
});
