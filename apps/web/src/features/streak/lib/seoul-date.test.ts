// Asia/Seoul 날짜 도구의 계약 테스트
import { describe, expect, it } from 'vitest';

import { monthOf, shiftDay, weekdayLabelOf } from './seoul-date';

describe('monthOf', () => {
  it('날짜에서 연·월을 숫자로 뽑는다', () => {
    // when — 한 자리 월도 숫자로 떨어져야 한다
    expect(monthOf('2026-08-03')).toEqual({ year: 2026, month: 8 });
  });
});

describe('shiftDay', () => {
  it('달을 넘어가도 하루씩 민다', () => {
    expect(shiftDay('2026-08-01', -1)).toBe('2026-07-31');
    expect(shiftDay('2026-07-31', 1)).toBe('2026-08-01');
  });

  it('해를 넘어가도 하루씩 민다', () => {
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('윤일도 건너뛰지 않는다', () => {
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('weekdayLabelOf', () => {
  it('날짜의 요일을 한 글자로 준다', () => {
    // given — 2026-08-06은 목요일
    expect(weekdayLabelOf('2026-08-06')).toBe('목');
    expect(weekdayLabelOf('2026-08-09')).toBe('일');
  });
});
