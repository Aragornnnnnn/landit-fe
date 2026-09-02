// 설문 안내 편지 판별 — env에 적힌 편지 id와 같을 때만
import { describe, expect, it } from 'vitest';

import { isSurveyLetter } from './survey-letter';

describe('isSurveyLetter', () => {
  it('설정한 편지 id와 같으면 설문 편지다', () => {
    expect(isSurveyLetter(12, '12')).toBe(true);
    expect(isSurveyLetter(13, '12')).toBe(false);
  });

  it('설정이 비어 있으면 어떤 편지도 설문 편지가 아니다', () => {
    expect(isSurveyLetter(12, '')).toBe(false);
    expect(isSurveyLetter(12, undefined)).toBe(false);
  });
});
