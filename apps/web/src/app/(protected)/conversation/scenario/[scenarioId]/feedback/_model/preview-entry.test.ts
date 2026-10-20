// 피드백 뒤 프리미엄 프리뷰 시작 판정 — 신규·기존 무료, 재대화·지난 카드, 유료
import { describe, expect, it } from 'vitest';

import { previewEntryOf } from './preview-entry';

describe('previewEntryOf', () => {
  const base = {
    view: 'home' as const,
    replay: false,
    today: true,
    premiumPreview: { eligible: true, step: null },
  };

  it('무료 사용자의 첫 시나리오(레벨 분석으로 가는 길)는 레벨 결과 뒤에 프리뷰를 시작한다', () => {
    expect(previewEntryOf({ ...base, view: 'analyzing' })).toBe('level');
  });

  it('프리뷰를 안 본 무료 사용자가 오늘의 시나리오를 끝내면 총평 뒤에 프리뷰를 시작한다', () => {
    expect(previewEntryOf(base)).toBe('home');
  });

  it('재대화나 지난 날 카드는 프리뷰를 시작하지 않는다 — 첫 시나리오(레벨 분석)라도 지난 날 카드면 시작하지 않는다', () => {
    expect(previewEntryOf({ ...base, replay: true })).toBeNull();
    expect(previewEntryOf({ ...base, today: false })).toBeNull();
    expect(
      previewEntryOf({ ...base, view: 'analyzing', today: false }),
    ).toBeNull();
  });

  it('잠기지 않는 사람(표현 분기로 가는 길)은 프리뷰가 없다', () => {
    expect(previewEntryOf({ ...base, view: 'branch' })).toBeNull();
  });

  it('이미 시작했거나 끝낸 프리뷰는 다시 시작하지 않는다', () => {
    expect(
      previewEntryOf({
        ...base,
        premiumPreview: { eligible: true, step: 'CARD_FLIPPED' },
      }),
    ).toBeNull();
    expect(
      previewEntryOf({
        ...base,
        premiumPreview: { eligible: true, step: 'COMPLETED' },
      }),
    ).toBeNull();
  });

  it('프리뷰를 볼 수 없는 사람(유료·결제 못 하는 환경)은 원래 흐름으로 간다', () => {
    expect(
      previewEntryOf({
        ...base,
        view: 'analyzing',
        premiumPreview: { eligible: false, step: null },
      }),
    ).toBeNull();
  });
});
