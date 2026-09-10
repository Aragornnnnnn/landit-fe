// 기존 유저에게 배울 영어를 물을지 정하는 계약 — 서버가 "안 답했다"고 할 때만 묻는다
import { describe, expect, it } from 'vitest';

import { shouldAskAccent } from './profile-gate';

describe('shouldAskAccent', () => {
  it('답이 없으면 묻는다', () => {
    expect(shouldAskAccent(null)).toBe(true);
  });

  it('답이 있으면 묻지 않는다', () => {
    expect(shouldAskAccent('EN_GB')).toBe(false);
  });

  it('아직 모르면 묻지 않는다 — 이미 답한 사람에게 또 묻는 게 더 나쁘다', () => {
    expect(shouldAskAccent(undefined)).toBe(false);
  });
});
