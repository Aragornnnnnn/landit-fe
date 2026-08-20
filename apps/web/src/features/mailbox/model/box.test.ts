// 주소의 ?box= 해석 — 손으로 고친 주소가 들어와도 화면이 하나로 정해져야 한다
import { describe, expect, it } from 'vitest';

import { readBoxParam } from './box';

describe('readBoxParam', () => {
  it('보낸 편지를 가리키면 보낸 편지함을 연다', () => {
    expect(readBoxParam(new URLSearchParams('box=sent'))).toBe('sent');
  });

  it('값이 없으면 받은 편지함이 기본이다', () => {
    expect(readBoxParam(new URLSearchParams())).toBe('received');
  });

  it('모르는 값이면 받은 편지함으로 돌린다', () => {
    expect(readBoxParam(new URLSearchParams('box=trash'))).toBe('received');
  });
});
