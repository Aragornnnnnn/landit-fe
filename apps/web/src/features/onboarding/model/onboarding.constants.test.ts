// 온보딩 상수 순수 로직 — 사운드 로테이션 인덱스 선택 계약 검증
import { describe, expect, it } from 'vitest';

import { pickNextIndex, SOUND_QUESTIONS } from './onboarding.constants';

describe('pickNextIndex', () => {
  it('어떤 난수를 줘도 현재 인덱스는 다시 고르지 않는다', () => {
    // 상수 난수(경곗값 포함)로도 항상 현재와 다른 유효 인덱스를 준다
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      for (let current = 0; current < SOUND_QUESTIONS.length; current += 1) {
        const next = pickNextIndex(current, SOUND_QUESTIONS.length, () => r);
        expect(next).not.toBe(current);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(SOUND_QUESTIONS.length);
      }
    }
  });

  it('문구가 하나뿐이면 현재 인덱스를 그대로 둔다', () => {
    expect(pickNextIndex(0, 1)).toBe(0);
  });

  it('실제 난수로 반복해도 계약을 지킨다', () => {
    for (let t = 0; t < 500; t += 1) {
      const next = pickNextIndex(1, SOUND_QUESTIONS.length);
      expect(next).not.toBe(1);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(SOUND_QUESTIONS.length);
    }
  });
});
