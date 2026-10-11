// 혜택 목록의 약속 — 무료 줄이 먼저 오고, 구독 관리가 보는 목록에는 무료 줄이 없다
import { describe, expect, it } from 'vitest';

import { BENEFITS, PREMIUM_BENEFITS } from './benefits';

describe('BENEFITS', () => {
  it('무료로도 되는 줄이 맨 위에 오고, 그 아래는 전부 프리미엄 전용이다', () => {
    // 비교표는 위에서 아래로 "무료 → 프리미엄" 순으로 읽힌다. 섞이면 무료 열의 체크가 띄엄띄엄 보인다
    const firstPremium = BENEFITS.findIndex((benefit) => !benefit.free);

    expect(firstPremium).toBeGreaterThan(0);
    expect(BENEFITS.slice(firstPremium).every((b) => !b.free)).toBe(true);
  });
});

describe('PREMIUM_BENEFITS', () => {
  it('무료로도 되는 줄은 빠진다 — 구독 관리의 "이용 중인 혜택"에 무료 기능을 세지 않는다', () => {
    expect(PREMIUM_BENEFITS.some((benefit) => benefit.free)).toBe(false);
    expect(PREMIUM_BENEFITS.length).toBeLessThan(BENEFITS.length);
  });
});
