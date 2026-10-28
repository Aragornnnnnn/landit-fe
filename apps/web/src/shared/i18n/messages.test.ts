// 문구 병합 검증 — 일본어에 없는 키는 한국어로 채운다
import { describe, expect, it } from 'vitest';

import { mergeMessages } from './messages';

describe('mergeMessages', () => {
  it('덮는 쪽에 있는 문구는 덮는 쪽을 쓴다', () => {
    const merged = mergeMessages({ cta: '시작할게요' }, { cta: '始める' });

    expect(merged).toEqual({ cta: '始める' });
  });

  it('덮는 쪽에 없는 문구는 기본 쪽을 남긴다', () => {
    const merged = mergeMessages(
      { paywall: { cta: '시작할게요', title: '프리미엄' } },
      { paywall: { cta: '始める' } },
    );

    expect(merged).toEqual({ paywall: { cta: '始める', title: '프리미엄' } });
  });
});
