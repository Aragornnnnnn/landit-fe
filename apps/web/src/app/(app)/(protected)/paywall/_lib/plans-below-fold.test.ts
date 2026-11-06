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
        false,
      ),
    ).toBe(true);
  });

  it('일부만 보이거나 CTA에 가려져 있어도 true다', () => {
    expect(
      needsScrollToPlans(
        { top: 300, bottom: 750, height: 450 },
        viewport,
        covered,
        false,
      ),
    ).toBe(true);
  });

  it('CTA에 가리지 않고 통째로 보이면 false다', () => {
    expect(
      needsScrollToPlans(
        { top: 100, bottom: 650, height: 550 },
        viewport,
        covered,
        false,
      ),
    ).toBe(false);
  });

  it('크기를 잴 수 없으면(배치 전) false다 — 결제를 막지 않는다', () => {
    expect(
      needsScrollToPlans(
        { top: 0, bottom: 0, height: 0 },
        viewport,
        covered,
        false,
      ),
    ).toBe(false);
  });

  it('이미 맨 아래까지 내려왔으면 false다 — 더 내려갈 곳이 없는데 결제를 막으면 버튼이 먹통이 된다', () => {
    expect(
      needsScrollToPlans(
        { top: 300, bottom: 750, height: 450 },
        viewport,
        covered,
        true,
      ),
    ).toBe(false);
  });

  it('플랜 칸이 보이는 영역보다 크면 아래 끝만 본다 — 글자를 키운 기기에서도 맨 아래에 오면 결제한다', () => {
    // 보이는 영역 0~676보다 큰 700px 칸, 아래 끝이 보이는 영역 안
    expect(
      needsScrollToPlans(
        { top: -40, bottom: 660, height: 700 },
        viewport,
        covered,
        false,
      ),
    ).toBe(false);
  });

  it('1px 남짓 넘친 건 보인 것으로 친다 — 화면 배율로 생기는 소수점 오차', () => {
    expect(
      needsScrollToPlans(
        { top: 100, bottom: 676.6, height: 576.6 },
        viewport,
        covered,
        false,
      ),
    ).toBe(false);
  });
});
