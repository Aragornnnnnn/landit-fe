// 다음 화면이 퍼지는 원 검증 — 진행도 0이면 다음 화면이 안 보이고, 1이면 다 보인다. 그 사이엔 가장자리가 흐린 원이 커지며 다음 화면이 번져 들어온다
import { describe, expect, it } from 'vitest';

import { revealMask } from './reveal-clip';

const SIZE = { width: 300, height: 600 };

describe('revealMask', () => {
  it('진행도 0이면 다음 화면을 다 가린다', () => {
    expect(revealMask(0, { x: 50, y: 41 }, SIZE)).toBe(
      'linear-gradient(transparent, transparent)',
    );
  });

  it('진행도 1이면 가리는 것 없이 다음 화면이 다 보인다', () => {
    expect(revealMask(1, { x: 50, y: 95 }, SIZE)).toBe('none');
  });

  it('그 사이에서는 가장자리가 흐린 원이 진행도만큼 커진다 — 끝날 때 흐린 가장자리까지 가장 먼 구석을 지난다', () => {
    // 가운데에서 가장 먼 구석까지 335px, 흐린 띠 80px을 더한 415px의 절반
    expect(revealMask(0.5, { x: 50, y: 50 }, SIZE)).toBe(
      'radial-gradient(circle at 50% 50%, #000 128px, transparent 208px)',
    );
  });

  it('원이 흐린 띠보다 작을 땐 가운데부터 흐리게 시작한다', () => {
    expect(revealMask(0.1, { x: 50, y: 50 }, SIZE)).toBe(
      'radial-gradient(circle at 50% 50%, #000 0px, transparent 42px)',
    );
  });
});
