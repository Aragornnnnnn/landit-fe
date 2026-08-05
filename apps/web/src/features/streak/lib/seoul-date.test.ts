// Asia/Seoul 날짜 도구의 계약 테스트
import { describe, expect, it } from 'vitest';

import { monthOf } from './seoul-date';

describe('monthOf', () => {
  it('날짜에서 연·월을 숫자로 뽑는다', () => {
    // when — 한 자리 월도 숫자로 떨어져야 한다
    expect(monthOf('2026-08-03')).toEqual({ year: 2026, month: 8 });
  });
});
