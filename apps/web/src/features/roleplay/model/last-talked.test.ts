// 마지막 대화 시각 표시 규칙 검증 — 오늘 / 며칠 전 / 날짜 세 갈래
import { describe, expect, it } from 'vitest';

import { toLastTalked } from './last-talked';

const TODAY = '2026-10-31';

describe('toLastTalked', () => {
  it('오늘 대화했으면 오늘이다', () => {
    expect(toLastTalked('2026-10-31T09:12:00', TODAY)).toEqual({
      kind: 'today',
    });
  });

  it('일주일 안이면 며칠 전인지 센다', () => {
    expect(toLastTalked('2026-10-28T23:59:00', TODAY)).toEqual({
      kind: 'daysAgo',
      days: 3,
    });
  });

  it('달이 바뀌어도 날짜 차이로 센다', () => {
    expect(toLastTalked('2026-09-30T10:00:00', '2026-10-02')).toEqual({
      kind: 'daysAgo',
      days: 2,
    });
  });

  it('7일 이상 지났으면 날짜로 보여 준다', () => {
    expect(toLastTalked('2026-10-24T10:00:00', TODAY)).toEqual({
      kind: 'date',
    });
  });

  it('기기 날짜가 서버보다 늦게 가 미래 시각이 와도 오늘로 본다', () => {
    expect(toLastTalked('2026-11-01T00:10:00', TODAY)).toEqual({
      kind: 'today',
    });
  });
});
