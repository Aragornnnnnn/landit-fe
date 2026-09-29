// 종료 시트의 작별 인사 예시 — 목록 안에서 고르는지만 본다 (난수 끝값에서 목록 밖으로 새지 않는가)
import { describe, expect, it } from 'vitest';

import { GOODBYE_PHRASES, pickGoodbyePhrase } from './goodbye-phrase';

describe('pickGoodbyePhrase', () => {
  it('난수가 0이면 첫 인사를 고른다', () => {
    expect(pickGoodbyePhrase(() => 0)).toBe(GOODBYE_PHRASES[0]);
  });

  it('난수가 1에 가까워도 목록 밖으로 나가지 않고 마지막 인사를 고른다', () => {
    expect(pickGoodbyePhrase(() => 0.9999)).toBe(GOODBYE_PHRASES.at(-1));
  });
});
