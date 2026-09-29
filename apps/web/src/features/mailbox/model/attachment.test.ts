// 사진 담기 규칙 — 남은 칸만큼 앞에서부터 채우고, 넘쳤는지 알려준다
import { describe, expect, it } from 'vitest';

import { MAX_ATTACHMENTS, takeAttachable } from './attachment';

describe('takeAttachable', () => {
  it('남은 칸 안이면 고른 사진을 전부 담는다', () => {
    const result = takeAttachable(1, ['a', 'b']);

    expect(result).toEqual({ taken: ['a', 'b'], overflowed: false });
  });

  it('남은 칸보다 많이 고르면 앞에서부터 채우고 넘쳤다고 알린다', () => {
    const result = takeAttachable(1, ['a', 'b', 'c', 'd']);

    expect(result).toEqual({ taken: ['a', 'b'], overflowed: true });
  });

  it('이미 꽉 찼으면 하나도 담지 않고 넘쳤다고 알린다', () => {
    const result = takeAttachable(MAX_ATTACHMENTS, ['a']);

    expect(result).toEqual({ taken: [], overflowed: true });
  });
});
