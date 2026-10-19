// 피드백 뒤 첫 표현 투어 시작 판정 — 신규·기존 무료, 재대화·지난 카드, 유료, 무료 표현 없음
import { describe, expect, it } from 'vitest';

import { tourEntryOf } from './tour-entry';

describe('tourEntryOf', () => {
  const base = {
    view: 'home' as const,
    replay: false,
    today: true,
    tour: { eligible: true, step: null },
    freeExpression: true,
  };

  it('무료 사용자의 첫 시나리오(레벨 분석으로 가는 길)는 레벨 결과 뒤에 투어를 시작한다', () => {
    expect(tourEntryOf({ ...base, view: 'analyzing' })).toBe('LEVEL_SEEN');
  });

  it('투어를 안 본 무료 사용자가 오늘의 시나리오를 끝내면 총평 뒤에 투어를 시작한다', () => {
    expect(tourEntryOf(base)).toBe('FEEDBACK_SEEN');
  });

  it('재대화나 지난 날 카드는 투어를 시작하지 않는다 — 첫 시나리오(레벨 분석)라도 지난 날 카드면 시작하지 않는다', () => {
    expect(tourEntryOf({ ...base, replay: true })).toBeNull();
    expect(tourEntryOf({ ...base, today: false })).toBeNull();
    expect(
      tourEntryOf({ ...base, view: 'analyzing', today: false }),
    ).toBeNull();
  });

  it('잠기지 않는 사람(표현 분기로 가는 길)은 투어가 없다', () => {
    expect(tourEntryOf({ ...base, view: 'branch' })).toBeNull();
  });

  it('이미 시작했거나 끝낸 투어는 다시 시작하지 않는다', () => {
    expect(
      tourEntryOf({ ...base, tour: { eligible: true, step: 'CARD_FLIPPED' } }),
    ).toBeNull();
    expect(
      tourEntryOf({ ...base, tour: { eligible: true, step: 'COMPLETED' } }),
    ).toBeNull();
  });

  it('서버가 이 시나리오에서 무료로 열어 준 표현이 없으면 투어 없이 원래 흐름으로 간다', () => {
    expect(
      tourEntryOf({ ...base, view: 'analyzing', freeExpression: false }),
    ).toBeNull();
  });

  it('투어를 볼 수 없는 사람(유료·결제 못 하는 환경)은 원래 흐름으로 간다', () => {
    expect(
      tourEntryOf({
        ...base,
        view: 'analyzing',
        tour: { eligible: false, step: null },
      }),
    ).toBeNull();
  });
});
