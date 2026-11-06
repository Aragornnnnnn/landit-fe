// 숫자 올라가는 연출의 한 장면 — 진행도에 따라 0에서 목표까지 같은 표기로 커지는지 검증
import { describe, expect, it } from 'vitest';

import { countUpFrame } from './count-up';

describe('countUpFrame', () => {
  it('시작은 0이고 끝은 원래 표기 그대로다', () => {
    expect(countUpFrame('29K+', 0)).toBe('0K+');
    expect(countUpFrame('29K+', 1)).toBe('29K+');
    expect(countUpFrame('4.8', 0)).toBe('0.0');
    expect(countUpFrame('4.8', 1)).toBe('4.8');
  });

  it('중간에는 소수 자릿수와 꼬리 표기를 지키며 커진다', () => {
    // Given 절반쯤 지났을 때
    const half = countUpFrame('4.8', 0.5);

    // Then 소수 한 자리로, 0과 4.8 사이다
    expect(half).toMatch(/^\d\.\d$/);
    expect(Number(half)).toBeGreaterThan(0);
    expect(Number(half)).toBeLessThan(4.8);
    expect(countUpFrame('4K+', 0.5)).toMatch(/^\dK\+$/);
  });

  it('처음엔 빠르게, 끝에선 천천히 오른다', () => {
    expect(Number(countUpFrame('100', 0.5))).toBeGreaterThan(50);
  });

  it('숫자로 시작하지 않는 값은 그대로 둔다', () => {
    expect(countUpFrame('무제한', 0.3)).toBe('무제한');
  });
});
