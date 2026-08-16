// 목록 다음 장 판단 검증 — 서버가 다음이 있다고 하면서 커서를 안 주는 경우까지 계약이다
import { describe, expect, it } from 'vitest';

import { nextLetterCursor } from './letter-page';

const page = (hasNext: boolean, nextCursor: string | null) => ({
  items: [],
  hasNext,
  nextCursor,
});

describe('nextLetterCursor', () => {
  it('다음 장이 있으면 그 커서를 돌려준다', () => {
    expect(nextLetterCursor(page(true, 'c2'))).toBe('c2');
  });

  it('다음 장이 없으면 undefined를 돌려 더 묻지 않게 한다', () => {
    expect(nextLetterCursor(page(false, null))).toBeUndefined();
  });

  it('다음이 있다면서 커서가 없으면 없는 것으로 본다 — 빈 커서로 첫 장을 또 받지 않는다', () => {
    expect(nextLetterCursor(page(true, null))).toBeUndefined();
  });
});
