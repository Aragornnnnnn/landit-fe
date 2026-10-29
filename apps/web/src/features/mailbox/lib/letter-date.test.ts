// 편지 날짜 표기 — 서버가 주는 UTC 시각을 서울 기준으로 읽는지가 핵심
import { describe, expect, it } from 'vitest';

import { formatLetterDate, formatLetterDateTime } from './letter-date';

describe('formatLetterDate', () => {
  it('보낸 시각을 두 자리 연·월·일로 줄여 쓴다', () => {
    expect(formatLetterDate('2026-08-09T02:30:00Z', 'ko')).toBe('26.08.09');
  });

  it('서울에서 이미 다음 날이면 다음 날짜로 적는다', () => {
    // given — UTC 8월 9일 저녁은 서울에선 8월 10일 새벽이다
    expect(formatLetterDate('2026-08-09T16:00:00Z', 'ko')).toBe('26.08.10');
  });

  it('오프셋 없는 시각은 서울 벽시계로 읽는다 — 백엔드 LocalDateTime 대비', () => {
    // 기기 시간대로 해석하면 해외에서 하루가 밀린다
    expect(formatLetterDate('2026-08-10T00:30:00', 'ko')).toBe('26.08.10');
  });

  it('읽을 수 없는 시각이면 날짜만 비운다', () => {
    // 던지면 그 편지 한 줄 때문에 목록 전체가 에러 화면으로 간다
    expect(formatLetterDate('', 'ko')).toBe('');
    expect(formatLetterDate('2026-13-45T99:99:99Z', 'ko')).toBe('');
  });
});

describe('formatLetterDateTime', () => {
  it('상세 화면은 월·일과 오전/오후 시각을 함께 보여준다', () => {
    expect(formatLetterDateTime('2026-08-09T02:30:00Z', 'ko')).toBe(
      '8월 9일 오전 11:30',
    );
  });

  it('정오 이후는 오후로 적는다', () => {
    expect(formatLetterDateTime('2026-08-09T06:47:00Z', 'ko')).toBe(
      '8월 9일 오후 3:47',
    );
  });

  it('자정은 24시가 아니라 오전 12시로 적는다', () => {
    expect(formatLetterDateTime('2026-08-09T15:00:00Z', 'ko')).toBe(
      '8월 10일 오전 12:00',
    );
  });

  it('읽을 수 없는 시각이면 비운다 — 편지 한 통 때문에 화면이 죽지 않게', () => {
    expect(formatLetterDateTime('', 'ko')).toBe('');
  });
});

describe('일본어 화면', () => {
  it('목록 날짜는 빗금으로 잇는다', () => {
    expect(formatLetterDate('2026-08-09T02:30:00Z', 'ja')).toBe('26/08/09');
  });

  it('상세 시각은 일본어 오전·오후 표기로 적는다', () => {
    expect(formatLetterDateTime('2026-08-09T02:30:00Z', 'ja')).toBe(
      '8月9日 午前11:30',
    );
    expect(formatLetterDateTime('2026-08-09T06:47:00Z', 'ja')).toBe(
      '8月9日 午後3:47',
    );
  });

  it('자정·정오는 일본 관례대로 0시로 적는다', () => {
    expect(formatLetterDateTime('2026-08-09T15:00:00Z', 'ja')).toBe(
      '8月10日 午前0:00',
    );
    expect(formatLetterDateTime('2026-08-09T03:00:00Z', 'ja')).toBe(
      '8月9日 午後0:00',
    );
  });
});
