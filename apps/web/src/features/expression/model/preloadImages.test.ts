// 예문 이미지 preload 대상 URL 수집 검증 — null·빈·중복 분기
import { describe, expect, it } from 'vitest';

import type { ExpressionPractice, PracticeSentence } from '../api/practice';
import { collectPreloadImageUrls } from './preloadImages';

const sentence = (imageUrl: string | null): PracticeSentence => ({
  sentenceText: '',
  highlightingPart: '',
  sentenceTranslation: '',
  practiceQuestion: '',
  practiceQuestionTranslation: '',
  imageUrl,
});

const practice = (sentences: PracticeSentence[]): ExpressionPractice => ({
  targetExpressionText: '',
  baseExpressionMeaningText: '',
  usageDescription: '',
  practiceSentence: sentences,
  writingSentence: {
    writingSentenceText: '',
    writingSentenceTranslation: '',
    writingQuestion: '',
    writingQuestionTranslation: '',
  },
});

describe('collectPreloadImageUrls', () => {
  it('practice가 없으면 빈 배열을 준다', () => {
    expect(collectPreloadImageUrls(null)).toEqual([]);
  });

  it('예문이 없으면 빈 배열을 준다', () => {
    expect(collectPreloadImageUrls(practice([]))).toEqual([]);
  });

  it('이미지가 모두 없는 예문은 preload 대상이 없다', () => {
    expect(
      collectPreloadImageUrls(practice([sentence(null), sentence(null)])),
    ).toEqual([]);
  });

  it('이미지가 있는 예문의 URL만 모은다', () => {
    expect(
      collectPreloadImageUrls(
        practice([sentence('a.webp'), sentence(null), sentence('b.webp')]),
      ),
    ).toEqual(['a.webp', 'b.webp']);
  });

  it('같은 URL이 여러 번 나와도 한 번만 preload한다', () => {
    expect(
      collectPreloadImageUrls(
        practice([sentence('a.webp'), sentence('a.webp')]),
      ),
    ).toEqual(['a.webp']);
  });
});
