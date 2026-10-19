// 첫 표현 투어 판정 — 저장된 단계에서 다음 화면, 피드백 뒤 투어 시작 여부
import { describe, expect, it } from 'vitest';

import { tourEntryOf, tourScreenOf } from './tour-step';

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
    expect(tourScreenOf('CHALLENGE_INTRO_SEEN')).toBe('auto_flip');
    expect(tourScreenOf('CARD_FLIPPED')).toBe('free_expression');
    expect(tourScreenOf('FREE_EXPRESSION_DONE')).toBe('paywall');
  });
});

describe('tourEntryOf', () => {
  const base = {
    view: 'home' as const,
    replay: false,
    today: true,
    tour: { known: true, step: null },
    freeExpression: true,
  };

  it('무료 사용자의 첫 시나리오(레벨 분석으로 가는 길)는 레벨 결과 뒤에 투어를 시작한다', () => {
    expect(tourEntryOf({ ...base, view: 'analyzing' })).toBe('LEVEL_SEEN');
  });

  it('투어를 안 본 무료 사용자가 오늘의 시나리오를 끝내면 총평 뒤에 투어를 시작한다', () => {
    expect(tourEntryOf(base)).toBe('FEEDBACK_SEEN');
  });

  it('재대화나 지난 날 카드는 투어를 시작하지 않는다', () => {
    expect(tourEntryOf({ ...base, replay: true })).toBeNull();
    expect(tourEntryOf({ ...base, today: false })).toBeNull();
  });

  it('잠기지 않는 사람(표현 분기로 가는 길)은 투어가 없다', () => {
    expect(tourEntryOf({ ...base, view: 'branch' })).toBeNull();
  });

  it('이미 시작했거나 끝낸 투어는 다시 시작하지 않는다', () => {
    expect(
      tourEntryOf({ ...base, tour: { known: true, step: 'CARD_FLIPPED' } }),
    ).toBeNull();
    expect(
      tourEntryOf({ ...base, tour: { known: true, step: 'COMPLETED' } }),
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
        tour: { known: false, step: null },
      }),
    ).toBeNull();
  });
});
