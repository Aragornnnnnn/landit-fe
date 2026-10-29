// 온보딩 첫 시나리오 소개 규칙 — 시작 버튼이 부를 상대 이름 계약 검증
import { describe, expect, it } from 'vitest';

import { partnerNameOf } from './scenario-intro';

describe('partnerNameOf', () => {
  it.each([
    ['marco', 'Marco'],
    ['chloe', 'Chloe'],
    ['teddy', 'Teddy'],
  ] as const)('상대가 %s면 %s로 부른다', (partner, name) => {
    expect(partnerNameOf(partner)).toBe(name);
  });

  it('상대를 모르면 이름이 없다', () => {
    expect(partnerNameOf(null)).toBeNull();
  });
});
