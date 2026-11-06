// 상대 캐러셀 규칙 — 양끝에서 반대쪽으로 넘어가고, 각 상대는 보이는 상대 기준 왼쪽·가운데·오른쪽 자리에 선다
import { describe, expect, it } from 'vitest';

import { toCarouselSlot, wrapCarouselIndex } from './partner-carousel';

describe('wrapCarouselIndex', () => {
  it('마지막 다음은 처음이다', () => {
    expect(wrapCarouselIndex(3, 3)).toBe(0);
  });

  it('처음 이전은 마지막이다', () => {
    expect(wrapCarouselIndex(-1, 3)).toBe(2);
  });

  it('범위 안이면 그대로다', () => {
    expect(wrapCarouselIndex(1, 3)).toBe(1);
  });
});

describe('toCarouselSlot', () => {
  it('보이는 상대는 가운데(0)에 선다', () => {
    expect(toCarouselSlot(1, 1, 3)).toBe(0);
  });

  it('다음 상대는 오른쪽(1), 이전 상대는 왼쪽(-1)에서 기다린다', () => {
    expect(toCarouselSlot(2, 1, 3)).toBe(1);
    expect(toCarouselSlot(0, 1, 3)).toBe(-1);
  });

  it('끝에 있어도 다음은 처음 상대, 이전은 마지막 상대다 — 그래서 어느 쪽으로든 같은 방향으로 들어온다', () => {
    expect(toCarouselSlot(0, 2, 3)).toBe(1);
    expect(toCarouselSlot(2, 0, 3)).toBe(-1);
  });
});
