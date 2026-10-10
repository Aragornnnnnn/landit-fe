// 자정까지 남은 시간의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  clockLabel,
  isUrgent,
  msUntilKstMidnight,
  msUntilUrgentChange,
  shortClockLabel,
} from './time-left';

describe('msUntilKstMidnight', () => {
  it('한국 시각 밤 11시면 한 시간이 남는다', () => {
    // given — 2026-10-10 23:00 KST = 14:00 UTC
    const now = Date.UTC(2026, 9, 10, 14, 0, 0);

    expect(msUntilKstMidnight(now)).toBe(60 * 60 * 1000);
  });

  it('한국 시각 자정 직후면 하루가 거의 다 남는다', () => {
    // given — 2026-10-11 00:00:01 KST
    const now = Date.UTC(2026, 9, 10, 15, 0, 1);

    expect(msUntilKstMidnight(now)).toBe(24 * 60 * 60 * 1000 - 1000);
  });
});

describe('msUntilUrgentChange', () => {
  const HOUR = 60 * 60 * 1000;

  it('낮에는 급해지는 순간까지 남은 시간을 준다', () => {
    // given — 자정까지 열 시간. 네 시간 뒤에 급해진다
    expect(msUntilUrgentChange(10 * HOUR)).toBe(4 * HOUR);
  });

  it('급할 때는 자정까지 남은 시간을 준다', () => {
    expect(msUntilUrgentChange(2 * HOUR)).toBe(2 * HOUR);
  });
});

describe('isUrgent', () => {
  it('여섯 시간이 남은 순간부터 심각하게 알린다', () => {
    expect(isUrgent(6 * 60 * 60 * 1000)).toBe(true);
  });

  it('그보다 넉넉하면 아직이다', () => {
    expect(isUrgent(6 * 60 * 60 * 1000 + 1000)).toBe(false);
  });
});

describe('clockLabel', () => {
  it('시·분·초를 두 자리씩 적는다', () => {
    expect(clockLabel(((8 * 60 + 50) * 60 + 12) * 1000)).toBe('08:50:12');
  });

  it('1초가 안 남아도 올려서 1초로 적는다', () => {
    expect(clockLabel(400)).toBe('00:00:01');
  });

  it('지났으면 0에서 멈춘다', () => {
    expect(clockLabel(-5000)).toBe('00:00:00');
  });
});

describe('shortClockLabel', () => {
  it('초는 빼고 분은 올려 적는다', () => {
    expect(shortClockLabel(((2 * 60 + 41) * 60 + 54) * 1000)).toBe('2:42');
  });

  it('한 시간이 안 남으면 0시로 적는다', () => {
    expect(shortClockLabel(25 * 60_000)).toBe('0:25');
  });
});
