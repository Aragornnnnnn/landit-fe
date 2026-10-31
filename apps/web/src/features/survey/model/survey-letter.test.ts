// 설문 안내 편지 판별 — env에 적힌 편지 id(쉼표로 여럿 가능)로 어느 설문을 여는 편지인지 정한다
import { describe, expect, it } from 'vitest';

import { surveyOfLetter } from './survey-letter';

describe('surveyOfLetter', () => {
  it('일반 설문 편지 id면 일반 설문, 결제자 설문 편지 id면 결제자 설문이다', () => {
    const configured = { general: '12', paid: '20' };

    expect(surveyOfLetter(12, configured)).toBe('general');
    expect(surveyOfLetter(20, configured)).toBe('paid');
    expect(surveyOfLetter(13, configured)).toBeNull();
  });

  it('쉼표로 여러 id를 적으면 그중 하나면 된다', () => {
    const configured = { general: '12, 7,30', paid: undefined };

    expect(surveyOfLetter(7, configured)).toBe('general');
    expect(surveyOfLetter(8, configured)).toBeNull();
  });

  it('설정이 비어 있으면 어떤 편지도 설문 편지가 아니다', () => {
    expect(surveyOfLetter(12, { general: '', paid: undefined })).toBeNull();
  });
});
