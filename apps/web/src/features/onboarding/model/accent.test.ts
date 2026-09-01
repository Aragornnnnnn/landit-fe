// 배울 영어 선택지 계약 검증 — 값은 BE enum, 순서는 시안
import { describe, expect, it } from 'vitest';

import { ACCENTS, DEFAULT_ACCENT } from './accent';

describe('ACCENTS', () => {
  it('선택지가 미국·영국·호주 순이다 — 시안 순서와 같다', () => {
    expect(ACCENTS.map((item) => item.locale)).toEqual([
      'EN_US',
      'EN_GB',
      'EN_AU',
    ]);
  });

  it('기본값이 선택지 안에 있다', () => {
    expect(ACCENTS.some((item) => item.locale === DEFAULT_ACCENT)).toBe(true);
  });
});
