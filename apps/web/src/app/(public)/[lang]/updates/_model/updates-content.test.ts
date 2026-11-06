// 업데이트 기록 — 언어별 날짜 표기와 문구·그림 고르기 검증
import { describe, expect, it } from 'vitest';

import { formatUpdateDate, updateEntries, UPDATES } from './updates-content';

describe('formatUpdateDate', () => {
  it('한국어는 점 찍은 날짜로 쓴다', () => {
    expect(formatUpdateDate('ko', '2026-11-05')).toBe('2026. 11. 5.');
  });

  it('일본어는 年月日로 쓴다', () => {
    expect(formatUpdateDate('ja', '2026-06-15')).toBe('2026年6月15日');
  });
});

describe('updateEntries', () => {
  it('최신 기록이 맨 위에 온다', () => {
    const dates = UPDATES.map(({ date }) => date);

    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('일본어 화면은 일본어 문구와, 있으면 일본어 그림을 쓴다', () => {
    // Given 일본어 그림이 따로 있는 기록과 없는 기록
    const withJaImage = UPDATES.findIndex((update) => update.jaImage);
    const withoutJaImage = UPDATES.findIndex((update) => !update.jaImage);

    // When
    const entries = updateEntries('ja');

    // Then
    expect(entries[withJaImage].image).toBe(UPDATES[withJaImage].jaImage);
    expect(entries[withoutJaImage].image).toBe(UPDATES[withoutJaImage].image);
    expect(entries[0].title).toBe(UPDATES[0].ja.title);
    expect(entries[0].displayDate).toBe(
      formatUpdateDate('ja', UPDATES[0].date),
    );
  });

  it('한국어 화면은 한국어 문구와 기본 그림을 쓴다', () => {
    const entries = updateEntries('ko');

    expect(entries.map(({ title }) => title)).toEqual(
      UPDATES.map(({ ko }) => ko.title),
    );
    expect(entries.map(({ image }) => image)).toEqual(
      UPDATES.map(({ image }) => image),
    );
  });
});
