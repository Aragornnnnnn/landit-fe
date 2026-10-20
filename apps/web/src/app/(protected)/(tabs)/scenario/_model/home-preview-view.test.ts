// 홈에서 프리뷰가 무엇을 보여 줄지 — 앱을 새로 열어도 마지막 단계 다음부터 바로 이어 간다
import { describe, expect, it } from 'vitest';

import { homePreviewViewOf, previewHoldsSheets } from './home-preview-view';

describe('homePreviewViewOf', () => {
  const base = {
    screen: 'tutorial' as const,
    cleared: true,
    showerHold: false,
  };

  it('프리뷰가 없으면 아무것도 띄우지 않는다', () => {
    expect(homePreviewViewOf({ ...base, screen: 'none' })).toBe('none');
  });

  it('튜토리얼은 동전 연출이 끝난 뒤에 띄운다', () => {
    expect(homePreviewViewOf({ ...base, showerHold: true })).toBe('none');
    expect(homePreviewViewOf(base)).toBe('tutorial');
  });

  it('카드 뒤집기와 무료 표현은 카드에서 한다 — 앱을 새로 열어도 안내 없이 바로 이어 간다', () => {
    expect(homePreviewViewOf({ ...base, screen: 'flip_card' })).toBe('card');
    expect(homePreviewViewOf({ ...base, screen: 'free_expression' })).toBe(
      'card',
    );
  });

  it('카드가 필요한 차례인데 오늘 카드를 아직 안 끝냈으면(날이 바뀜) 다음 대화까지 쉰다', () => {
    expect(
      homePreviewViewOf({ ...base, screen: 'flip_card', cleared: false }),
    ).toBe('none');
  });
});

describe('previewHoldsSheets', () => {
  it('프리뷰 대상인지 아직 모르면 미룬다 — 튜토리얼보다 소감이 먼저 떴다 사라지지 않게', () => {
    expect(previewHoldsSheets({ deciding: true, step: null })).toBe(true);
  });

  it('프리뷰가 진행 중이면 무료 표현을 마칠 때까지 미룬다 — 화면에 아무것도 안 떠 있어도', () => {
    for (const step of [
      'STARTED',
      'TUTORIAL_DONE',
      'CARD_FLIPPED',
      'FREE_OPENED',
    ] as const)
      expect(previewHoldsSheets({ deciding: false, step })).toBe(true);
  });

  it('프리뷰를 끝냈거나 대상이 아니면 미루지 않는다', () => {
    expect(previewHoldsSheets({ deciding: false, step: 'COMPLETED' })).toBe(
      false,
    );
    expect(previewHoldsSheets({ deciding: false, step: null })).toBe(false);
  });
});
