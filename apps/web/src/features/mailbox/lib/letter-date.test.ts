// 편지 날짜 표기 — 서버가 주는 UTC 시각을 서울 기준으로 읽는지가 핵심
import { describe, expect, it } from 'vitest';

import { formatLetterDate } from './letter-date';

describe('formatLetterDate', () => {
  it('보낸 시각을 두 자리 연·월·일로 줄여 쓴다', () => {
    expect(formatLetterDate('2026-08-09T02:30:00Z')).toBe('26.08.09');
  });

  it('서울에서 이미 다음 날이면 다음 날짜로 적는다', () => {
    // given — UTC 8월 9일 저녁은 서울에선 8월 10일 새벽이다
    expect(formatLetterDate('2026-08-09T16:00:00Z')).toBe('26.08.10');
  });

  it('오프셋 없는 시각은 서울 벽시계로 읽는다 — 백엔드 LocalDateTime 대비', () => {
    // 기기 시간대로 해석하면 해외에서 하루가 밀린다
    expect(formatLetterDate('2026-08-10T00:30:00')).toBe('26.08.10');
  });

  it('읽을 수 없는 시각이면 날짜만 비운다', () => {
    // 던지면 그 편지 한 줄 때문에 목록 전체가 에러 화면으로 간다
    expect(formatLetterDate('')).toBe('');
    expect(formatLetterDate('2026-13-45T99:99:99Z')).toBe('');
  });
});
