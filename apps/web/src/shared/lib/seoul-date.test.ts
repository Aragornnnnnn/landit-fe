// 서울 날짜 조각 — 오프셋 없는 BE 시각은 서울로, 오프셋 있는 시각은 환산하고, 못 읽으면 null
import { describe, expect, it } from 'vitest';

import { readSeoulDateParts } from './seoul-date';

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
