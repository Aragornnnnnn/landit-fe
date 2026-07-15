// 대표 예문 → 퀴즈 변환 검증 — 단어뱅크 필드가 learning-start에서 제대로 옮겨오는지
import { describe, expect, it } from 'vitest';

import type { ExpressionLearning } from '../api/learning';
import { fromLearning } from './sentenceQuiz';

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
