import { describe, expect, it } from 'vitest';

import { toSessionTitle } from './session-summary';

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
