// 다음 화면이 퍼지는 원 검증 — 진행도 0이면 원이 없어 다음 화면이 안 보이고, 1이면 폰 화면 어느 구석까지 덮는다. 퍼지는 동안엔 원 가장자리에 밝은 띠가 따라가 화면 전체가 바뀌는 게 보인다
import { describe, expect, it } from 'vitest';

import { revealClip, revealRing } from './reveal-clip';

describe('revealClip', () => {
  it('진행도 0이면 원 크기가 0이라 다음 화면이 보이지 않는다', () => {
    expect(revealClip(0, { x: 50, y: 41 })).toBe('circle(0% at 50% 41%)');
  });

  it('진행도 1이면 폰 화면 모서리에서 시작해도 반대쪽 구석까지 덮는다', () => {
    expect(revealClip(1, { x: 50, y: 95 })).toBe('circle(130% at 50% 95%)');
  });

  it('그 사이에서는 진행도만큼 원이 커진다', () => {
    expect(revealClip(0.5, { x: 35, y: 14 })).toBe('circle(65% at 35% 14%)');
  });
});

describe('revealRing', () => {
  const SIZE = { width: 300, height: 600 };

  it('바뀌기 전과 다 바뀐 뒤엔 띠가 없다', () => {
    expect(revealRing(0, { x: 50, y: 41 }, SIZE)).toBe('none');
    expect(revealRing(1, { x: 50, y: 41 }, SIZE)).toBe('none');
  });

  it('퍼지는 동안엔 원과 같은 크기의 가장자리 안쪽에 밝은 띠를 그린다', () => {
    // 원 크기 65%는 화면 대각선 기준(약 474px)의 65% = 308px
    expect(revealRing(0.5, { x: 50, y: 41 }, SIZE)).toBe(
      'radial-gradient(circle at 50% 41%, transparent 284px, rgba(255, 255, 255, 0.55) 306px, transparent 308px)',
    );
  });
});
