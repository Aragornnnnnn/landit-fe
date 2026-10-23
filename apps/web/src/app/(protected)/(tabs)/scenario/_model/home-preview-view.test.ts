// 홈에서 프리뷰가 무엇을 보여 줄지 — 앱을 새로 열어도 마지막 단계 다음부터 바로 이어 간다
import { describe, expect, it } from 'vitest';

import {
  homePreviewViewOf,
  previewHoldsSatisfaction,
} from './home-preview-view';

describe('homePreviewViewOf', () => {
  const base = {
    screen: 'tutorial' as const,
    cleared: true,
    held: false,
  };

  it('프리뷰가 없으면 아무것도 띄우지 않는다', () => {
    expect(homePreviewViewOf({ ...base, screen: 'none' })).toBe('none');
  });

  it('튜토리얼은 동전 연출이 끝난 뒤에 띄운다', () => {
    expect(homePreviewViewOf({ ...base, held: true })).toBe('none');
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

describe('previewHoldsSatisfaction', () => {
  const base = {
    deciding: false,
    step: null,
    actedThisVisit: false,
  };

  it('프리뷰 대상인지 아직 모르면 미룬다', () => {
    expect(previewHoldsSatisfaction({ ...base, deciding: true })).toBe(true);
  });

  it('튜토리얼이 남아 있으면 미룬다', () => {
    expect(previewHoldsSatisfaction({ ...base, step: 'STARTED' })).toBe(true);
  });

  it('이번 방문에 프리뷰를 진행했으면 미룬다 — 무료 표현을 누른 순간 표현 화면 직전에 번쩍 뜨지 않게', () => {
    for (const step of [
      'TUTORIAL_DONE',
      'CARD_FLIPPED',
      'FREE_OPENED',
    ] as const)
      expect(
        previewHoldsSatisfaction({ ...base, step, actedThisVisit: true }),
      ).toBe(true);
  });

  it('튜토리얼 뒤에서 멈췄다가 홈에 다시 왔으면 묻는다 — 좋았어요가 리뷰 요청의 문이라 영영 안 묻게 두지 않는다', () => {
    for (const step of [
      'TUTORIAL_DONE',
      'CARD_FLIPPED',
      'FREE_OPENED',
    ] as const)
      expect(previewHoldsSatisfaction({ ...base, step })).toBe(false);
  });

  it('프리뷰를 끝냈으면 이번 방문에 넘겼어도 묻는다', () => {
    expect(
      previewHoldsSatisfaction({
        ...base,
        step: 'COMPLETED',
        actedThisVisit: true,
      }),
    ).toBe(false);
    expect(previewHoldsSatisfaction(base)).toBe(false);
  });
});
