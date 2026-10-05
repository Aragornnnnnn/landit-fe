import { describe, expect, it } from 'vitest';

import { fitScale } from './fitScale';

describe('fitScale — 목업을 남는 높이에 맞춰 줄인다', () => {
  it('남는 높이가 목업보다 크면 원래 크기 그대로 둔다', () => {
    expect(fitScale(600, 430)).toBe(1);
  });

  it('남는 높이가 목업보다 작으면 그 비율만큼 줄인다', () => {
    expect(fitScale(215, 430)).toBe(0.5);
  });

  it('높이를 아직 못 쟀으면(0) 원래 크기로 둔다', () => {
    expect(fitScale(0, 430)).toBe(1);
  });
});
