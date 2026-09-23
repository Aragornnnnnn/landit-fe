// 남은 시간 표기 — 글자 폭이 흔들리지 않아야 카운트다운이 떨지 않는다
import { describe, expect, it } from 'vitest';

import { formatPromoClock } from './promo-clock';

describe('formatPromoClock', () => {
  it('분과 초를 두 자리로 채운다', () => {
    expect(formatPromoClock(165)).toBe('02:45');
    expect(formatPromoClock(9)).toBe('00:09');
    expect(formatPromoClock(300)).toBe('05:00');
  });

  it('끝났거나 음수면 0으로 본다', () => {
    expect(formatPromoClock(0)).toBe('00:00');
    expect(formatPromoClock(-3)).toBe('00:00');
  });
});
