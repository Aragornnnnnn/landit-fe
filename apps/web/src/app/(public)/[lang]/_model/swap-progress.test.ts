// 폰 화면 바꾸기 진행도 검증 — 판 가운데가 화면 65% 높이에 올 때까지는 첫 화면 그대로이고, 40%까지 올리는 동안 천천히 다 바뀐다. 한 번 튕겨 넘겨도 바뀌는 과정이 보일 만큼 구간이 길다
import { describe, expect, it } from 'vitest';

import { swapProgress } from './swap-progress';

const VIEWPORT = 1000;

describe('swapProgress', () => {
  it('판 가운데가 화면 65% 아래에 있을 때까지는 첫 화면이 다 보인다', () => {
    expect(swapProgress(900, VIEWPORT)).toBe(0);
    expect(swapProgress(650, VIEWPORT)).toBe(0);
  });

  it('화면 40% 높이까지 올라오면 다음 화면으로 다 바뀐다', () => {
    expect(swapProgress(400, VIEWPORT)).toBe(1);
    expect(swapProgress(100, VIEWPORT)).toBe(1);
  });

  it('그 사이에서는 올라온 만큼 바뀐다 — 다시 내리면 되돌아간다', () => {
    expect(swapProgress(525, VIEWPORT)).toBeCloseTo(0.5);
    expect(swapProgress(587.5, VIEWPORT)).toBeCloseTo(0.25);
  });
});
