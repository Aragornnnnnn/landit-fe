// 첫 표현 투어 다음 화면 — 저장된 마지막 단계에서 지금 보여 줄 화면
import { describe, expect, it } from 'vitest';

import { tourScreenOf } from './tour-step';

describe('tourScreenOf', () => {
  it('시작 전이거나 끝났으면 투어 화면이 없다', () => {
    expect(tourScreenOf(null)).toBe('none');
    expect(tourScreenOf('COMPLETED')).toBe('none');
  });

  it('레벨이나 총평까지 봤으면 홈에서 챌린지 소개를 본다', () => {
    expect(tourScreenOf('LEVEL_SEEN')).toBe('challenge_intro');
    expect(tourScreenOf('FEEDBACK_SEEN')).toBe('challenge_intro');
  });

  it('소개 다음은 카드 뒤집기, 뒤집은 다음은 무료 표현, 표현을 끝냈으면 페이월이다', () => {
    expect(tourScreenOf('CHALLENGE_INTRO_SEEN')).toBe('flip_card');
    expect(tourScreenOf('CARD_FLIPPED')).toBe('free_expression');
    expect(tourScreenOf('FREE_EXPRESSION_DONE')).toBe('paywall');
  });
});
