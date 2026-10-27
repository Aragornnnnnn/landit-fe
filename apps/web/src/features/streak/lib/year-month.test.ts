// 스트릭 달력 연·월 도구의 계약 테스트
import { describe, expect, it } from 'vitest';

import { formatMonthLabel, monthOf } from './year-month';

describe('monthOf', () => {
  it('날짜에서 연·월을 숫자로 뽑는다', () => {
    // when — 한 자리 월도 숫자로 떨어져야 한다
    expect(monthOf('2026-08-03')).toEqual({ year: 2026, month: 8 });
  });
});

describe('formatMonthLabel', () => {
  it('달 이름을 화면 언어로 쓴다', () => {
    expect(formatMonthLabel({ year: 2026, month: 8 }, 'ko')).toBe('2026년 8월');
    expect(formatMonthLabel({ year: 2026, month: 8 }, 'ja')).toBe('2026年8月');
  });
});
