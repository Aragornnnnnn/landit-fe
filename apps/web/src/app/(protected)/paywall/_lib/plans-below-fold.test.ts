// CTA가 결제 대신 맨 아래로 내려 줘야 하는지 — 플랜 칸이 화면(하단 CTA에 가린 곳 제외)에 다 보이지 않을 때만
import { describe, expect, it } from 'vitest';

import { needsScrollToPlans } from './plans-below-fold';

/** 화면 0~800, 아래 124px은 하단 고정 CTA가 가린다 */
const viewport = { top: 0, bottom: 800 };
const covered = 124;

describe('needsScrollToPlans', () => {
  it('플랜 칸이 화면 아래로 벗어나 있으면 true다', () => {
    expect(
      needsScrollToPlans(
        { top: 1200, bottom: 1700, height: 500 },
        viewport,
        covered,
      ),
    ).toBe(true);
  });

  it('일부만 보이거나 CTA에 가려져 있어도 true다', () => {
    expect(
      needsScrollToPlans(
        { top: 300, bottom: 750, height: 450 },
        viewport,
        covered,
      ),
    ).toBe(true);
  });

  it('CTA에 가리지 않고 통째로 보이면 false다', () => {
    expect(
      needsScrollToPlans(
        { top: 100, bottom: 650, height: 550 },
        viewport,
        covered,
      ),
    ).toBe(false);
  });

  it('크기를 잴 수 없으면(배치 전) false다 — 결제를 막지 않는다', () => {
    expect(
      needsScrollToPlans({ top: 0, bottom: 0, height: 0 }, viewport, covered),
    ).toBe(false);
  });
});
