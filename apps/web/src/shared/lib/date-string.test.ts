// 날짜 문자열 계산의 계약 테스트
import { describe, expect, it } from 'vitest';

import { shiftDay, weekdayLabelOf } from './date-string';

describe('shiftDay', () => {
  it.each([
    {
      label: '달을 넘어 뒤로',
      date: '2026-08-01',
      delta: -1,
      expected: '2026-07-31',
    },
    {
      label: '달을 넘어 앞으로',
      date: '2026-07-31',
      delta: 1,
      expected: '2026-08-01',
    },
    {
      label: '해를 넘어',
      date: '2026-01-01',
      delta: -1,
      expected: '2025-12-31',
    },
    { label: '윤일', date: '2028-02-28', delta: 1, expected: '2028-02-29' },
  ])('$label 하루씩 민다', ({ date, delta, expected }) => {
    expect(shiftDay(date, delta)).toBe(expected);
  });
});

describe('weekdayLabelOf', () => {
  it.each([
    { date: '2026-08-06', expected: '목' },
    { date: '2026-08-09', expected: '일' },
  ])('$date 는 $expected요일이다', ({ date, expected }) => {
    expect(weekdayLabelOf(date)).toBe(expected);
  });
});
