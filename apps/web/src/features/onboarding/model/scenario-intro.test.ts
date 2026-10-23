// 온보딩 첫 시나리오 소개 규칙 — 시작 버튼 문구가 대화 상대를 부르는 계약 검증
import { describe, expect, it } from 'vitest';

import { startLabelOf } from './scenario-intro';

describe('startLabelOf', () => {
  it.each([
    ['marco', 'Marco와 대화 시작할게요!'],
    ['chloe', 'Chloe와 대화 시작할게요!'],
    ['teddy', 'Teddy와 대화 시작할게요!'],
  ] as const)('상대가 %s면 "%s"', (partner, label) => {
    expect(startLabelOf(partner)).toBe(label);
  });

  it('상대를 모르면 이름 없이 첫 대화를 시작한다고 쓴다', () => {
    expect(startLabelOf(null)).toBe('첫 대화 시작할게요!');
  });
});
