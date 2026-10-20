// 첫 표현 투어 다음 화면 — 저장된 마지막 단계에서 지금 보여 줄 화면
import { describe, expect, it } from 'vitest';

import { awaitsFreeExpressionFinish, tourScreenOf } from './tour-step';

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

  it('무료 표현을 한 번 열었으면 다시 비추지 않는다 — 끝까지 안 하고 나와도 카드를 뒤집을 때마다 뜨지 않게', () => {
    expect(tourScreenOf('FREE_OPENED')).toBe('none');
  });
});

describe('awaitsFreeExpressionFinish', () => {
  it('무료 표현 차례이거나 열어 둔 채 나왔으면 그 표현을 마칠 때 투어를 끝낸다', () => {
    expect(awaitsFreeExpressionFinish('CARD_FLIPPED')).toBe(true);
    expect(awaitsFreeExpressionFinish('FREE_OPENED')).toBe(true);
  });

  it('그 밖의 단계에선 표현을 마쳐도 투어와 상관없다', () => {
    expect(awaitsFreeExpressionFinish(null)).toBe(false);
    expect(awaitsFreeExpressionFinish('STARTED')).toBe(false);
    expect(awaitsFreeExpressionFinish('TUTORIAL_DONE')).toBe(false);
    expect(awaitsFreeExpressionFinish('COMPLETED')).toBe(false);
  });
});
