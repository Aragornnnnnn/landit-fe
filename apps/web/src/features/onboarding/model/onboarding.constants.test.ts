// 온보딩 상수 순수 로직 — 사운드 로테이션 인덱스 선택 계약 검증
import { describe, expect, it } from 'vitest';

import { pickNextIndex, SOUND_QUESTIONS } from './onboarding.constants';

describe('pickNextIndex', () => {
  it('현재 인덱스와 다른 값을 고른다', () => {
    // Given 현재 인덱스가 0이고 rand가 우연히 0을 먼저 반환할 때
    let call = 0;
    const rand = () => [0, 0.5][call++] ?? 0;

    // When 다음 인덱스를 고르면
    const next = pickNextIndex(0, SOUND_QUESTIONS.length, rand);

    // Then 현재와 겹치는 0은 건너뛰고 다른 인덱스를 준다
    expect(next).not.toBe(0);
  });

  it('문구가 하나뿐이면 현재 인덱스를 그대로 둔다', () => {
    expect(pickNextIndex(0, 1)).toBe(0);
  });

  it('항상 0 이상 length 미만의 인덱스를 준다', () => {
    for (let r = 0; r < 1; r += 0.1) {
      const next = pickNextIndex(2, SOUND_QUESTIONS.length, () => r);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(SOUND_QUESTIONS.length);
    }
  });
});
