// 햅틱 점검 안내 — 화면에서 실제로 쓰는 진동 이름과 리듬이 하나도 빠짐없이 목록에 있어야 한다
import { describe, expect, it } from 'vitest';

import { HAPTIC_KINDS, HAPTIC_RHYTHM_NAMES } from '@/shared/haptics';

import { HAPTIC_SPOTS } from './haptic-check-guide';

const moments = HAPTIC_SPOTS.flatMap((spot) => spot.moments);

describe('haptic-check-guide', () => {
  it.each(HAPTIC_KINDS.filter((kind) => kind !== 'tap'))(
    '%s 진동이 울리는 곳이 한 군데 이상 있다',
    (kind) => {
      expect(moments.some((m) => 'kind' in m && m.kind === kind)).toBe(true);
    },
  );

  it.each(HAPTIC_RHYTHM_NAMES)(
    '%s 리듬이 울리는 곳이 한 군데 이상 있다',
    (rhythm) => {
      expect(moments.some((m) => 'rhythm' in m && m.rhythm === rhythm)).toBe(
        true,
      );
    },
  );
});
