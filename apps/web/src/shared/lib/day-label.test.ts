// 서버 날짜 표기 — 시간대 없는 값을 그 날 그대로 읽는다
import { describe, expect, it } from 'vitest';

import { toDayLabel } from './day-label';

describe('toDayLabel', () => {
  it('앞자리 0을 떼고 읽히는 날짜로 바꾼다', () => {
    expect(toDayLabel('2026-07-08T21:03:11')).toBe('7월 8일');
  });

  it('시간대 없이 온 값이라 앞의 날짜만 쓴다 — 늦은 밤도 그 날로 남는다', () => {
    // Date로 파싱하면 브라우저가 UTC로 읽어 하루가 밀 수 있다
    expect(toDayLabel('2026-07-28T23:50:00')).toBe('7월 28일');
  });
});
