// 아래에 더 있는지 판정 — 끝까지 내렸으면 흐림을 거둔다
import { describe, expect, it } from 'vitest';

import { hasMoreBelow } from './useMoreBelow';

describe('hasMoreBelow', () => {
  it('보이는 높이보다 내용이 길고 아직 끝까지 내리지 않았으면 참이다', () => {
    expect(
      hasMoreBelow({ scrollTop: 0, clientHeight: 600, scrollHeight: 1200 }),
    ).toBe(true);
  });

  it('끝까지 내렸으면 거짓이다', () => {
    expect(
      hasMoreBelow({ scrollTop: 600, clientHeight: 600, scrollHeight: 1200 }),
    ).toBe(false);
  });

  it('소수점 스크롤로 1px 못 미치게 멈춰도 끝으로 본다 — 끝에서 흐림이 남지 않게', () => {
    expect(
      hasMoreBelow({ scrollTop: 599.5, clientHeight: 600, scrollHeight: 1200 }),
    ).toBe(false);
  });

  it('내용이 한 화면에 다 들어오면 거짓이다', () => {
    expect(
      hasMoreBelow({ scrollTop: 0, clientHeight: 600, scrollHeight: 600 }),
    ).toBe(false);
  });
});
