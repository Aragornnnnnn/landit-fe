// 알람 대상 — 누가 알람을 쓸 수 있는지(메뉴·셸 예약이 같은 규칙을 본다)
import { describe, expect, it } from 'vitest';

import { canUseAlarm } from './alarm-access';

describe('canUseAlarm', () => {
  it.each([
    ['유료 사용자', { premium: true }, false, true],
    ['무료 사용자', { premium: false }, false, false],
    ['ADMIN은 결제 없이도 쓴다', { premium: false }, true, true],
    ['구독을 아직 모르면 못 쓴다', undefined, false, false],
  ] as const)('%s', (_, subscription, isAdmin, expected) => {
    expect(canUseAlarm({ subscription, isAdmin })).toBe(expected);
  });
});
