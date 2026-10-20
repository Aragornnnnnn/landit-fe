// 환급 화면에서 나갈 때 신규 회원 특가를 띄울지 — 하루에 한 번만
import { describe, expect, it } from 'vitest';

import { exitOfferDue } from './reward-exit-offer';

describe('exitOfferDue', () => {
  it('오늘 아직 안 띄웠으면 띄운다', () => {
    expect(exitOfferDue(null, '2026-10-20')).toBe(true);
    expect(exitOfferDue('2026-10-19', '2026-10-20')).toBe(true);
  });

  it('오늘 이미 띄웠으면 바로 나간다 — 같은 날 다시 붙잡지 않는다', () => {
    expect(exitOfferDue('2026-10-20', '2026-10-20')).toBe(false);
  });
});
