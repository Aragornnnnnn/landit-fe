import { describe, expect, it } from 'vitest';

import { toDayLabel, toSessionTitle } from './session-summary';

describe('toDayLabel', () => {
  it('앞자리 0을 떼고 읽히는 날짜로 바꾼다', () => {
    expect(toDayLabel('2026-07-08T21:03:11')).toBe('7월 8일');
  });

  it('시간대 없이 온 값이라 앞의 날짜만 쓴다 — 늦은 밤도 그 날로 남는다', () => {
    // Date로 파싱하면 브라우저가 UTC로 읽어 하루가 밀 수 있다
    expect(toDayLabel('2026-07-28T23:50:00')).toBe('7월 28일');
  });
});

describe('toSessionTitle', () => {
  it('서버가 뽑은 제목을 그대로 쓴다', () => {
    expect(toSessionTitle('카페 얘기', '2026-07-28T21:03:11')).toBe(
      '카페 얘기',
    );
  });

  it('제목을 못 뽑았으면 날짜가 그 자리를 대신한다', () => {
    expect(toSessionTitle(null, '2026-07-28T21:03:11')).toBe('7월 28일의 대화');
  });
});
