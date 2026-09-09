// 구독 만료일 표기 — 서울 기준 날짜, 오프셋 없는 BE 시각도 서울로 읽는다
import { describe, expect, it } from 'vitest';

import { formatSubscriptionDate } from './subscription-date';

describe('formatSubscriptionDate', () => {
  it('BE LocalDateTime을 서울 날짜로 "년 월 일"로 쓴다', () => {
    expect(formatSubscriptionDate('2026-10-04T12:00:00')).toBe(
      '2026년 10월 4일',
    );
  });

  it('오프셋이 있는 시각은 서울로 환산한다 — UTC 저녁은 서울의 다음 날', () => {
    expect(formatSubscriptionDate('2026-10-04T16:00:00Z')).toBe(
      '2026년 10월 5일',
    );
  });

  it('읽을 수 없는 시각이면 빈 문자열이다', () => {
    expect(formatSubscriptionDate('언젠가')).toBe('');
  });
});
