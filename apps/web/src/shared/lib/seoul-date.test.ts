// 서울 기준 시각 — 오프셋 없는 BE 시각은 서울로, 오프셋 있는 시각은 환산하고, 못 읽으면 null·NaN
import { describe, expect, it } from 'vitest';

import { readSeoulDateParts, toSeoulInstant } from './seoul-date';

const DATE_ONLY = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
} as const;

describe('readSeoulDateParts', () => {
  it('오프셋 없는 시각은 서울 벽시계로 읽는다', () => {
    expect(readSeoulDateParts('2026-10-04T23:30:00', DATE_ONLY)).toMatchObject({
      year: '2026',
      month: '10',
      day: '4',
    });
  });

  it('오프셋이 있으면 서울로 환산한다 — UTC 저녁은 서울의 다음 날', () => {
    expect(readSeoulDateParts('2026-10-04T16:00:00Z', DATE_ONLY)).toMatchObject(
      {
        day: '5',
      },
    );
  });

  it('읽을 수 없는 시각이면 null이다', () => {
    expect(readSeoulDateParts('언젠가', DATE_ONLY)).toBeNull();
  });
});

describe('toSeoulInstant', () => {
  it('오프셋 없는 LocalDateTime은 서울 시각으로 읽는다 — 기기 시간대에 따라 밀리지 않게', () => {
    expect(toSeoulInstant('2026-09-30T21:10:00')).toBe(
      Date.parse('2026-09-30T12:10:00Z'),
    );
  });

  it('소수 초가 붙어 와도 읽는다', () => {
    expect(toSeoulInstant('2026-09-30T21:10:00.123456')).toBe(
      Date.parse('2026-09-30T12:10:00.123Z'),
    );
  });

  it('오프셋이 이미 붙어 있으면 덧붙이지 않는다', () => {
    expect(toSeoulInstant('2026-09-30T12:10:00Z')).toBe(
      Date.parse('2026-09-30T12:10:00Z'),
    );
  });

  it('읽을 수 없는 값이면 NaN이다', () => {
    expect(toSeoulInstant('어제')).toBeNaN();
  });
});
