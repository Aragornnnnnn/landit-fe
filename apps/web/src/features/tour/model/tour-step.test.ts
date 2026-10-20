// 첫 표현 투어 다음 화면 — 저장된 마지막 단계에서 지금 보여 줄 화면
import { describe, expect, it } from 'vitest';

import { tourScreenOf } from './tour-step';

describe('tourScreenOf', () => {
  it('시작 전이거나 끝났으면 투어 화면이 없다', () => {
    expect(tourScreenOf(null)).toBe('none');
    expect(tourScreenOf('COMPLETED')).toBe('none');
  });

  it('시작했으면 튜토리얼, 튜토리얼 다음은 카드 뒤집기, 뒤집은 다음은 무료 표현이다', () => {
    expect(tourScreenOf('STARTED')).toBe('tutorial');
    expect(tourScreenOf('TUTORIAL_DONE')).toBe('flip_card');
    expect(tourScreenOf('CARD_FLIPPED')).toBe('free_expression');
  });
});
