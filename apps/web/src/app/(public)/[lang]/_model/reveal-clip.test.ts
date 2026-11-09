// 다음 화면이 퍼지는 원 검증 — 진행도 0이면 다음 화면이 안 보이고, 1이면 다 보인다. 그 사이엔 가장자리가 흐린 원이 커지며 다음 화면이 번져 들어온다
import { describe, expect, it } from 'vitest';

import { revealMask, slideShift } from './reveal-clip';

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

describe('slideShift', () => {
  it('밀기 전엔 첫 화면은 제자리, 다음 화면은 폭 전체만큼 오른쪽 밖에 있다 — 소수점 폭이어도 끝에 조각이 비치지 않는다', () => {
    for (const progress of [0, 0.001]) {
      expect(slideShift(progress, 290.7)).toEqual({
        first: 'translate3d(0px, 0, 0)',
        next: 'translate3d(100%, 0, 0)',
      });
    }
  });

  it('진행도만큼 첫 화면은 왼쪽으로 나가고 다음 화면이 오른쪽에서 들어온다', () => {
    expect(slideShift(1, 290)).toEqual({
      first: 'translate3d(-290px, 0, 0)',
      next: 'translate3d(0px, 0, 0)',
    });
  });

  it('소수점 픽셀로 옮기지 않는다 — 글자가 스크롤마다 다시 섞여 그려져 흔들려 보인다', () => {
    // 290px의 0.3 = 87px, 1px 아래 자투리가 나오는 폭(290.4px)에서도 정수로 맞춘다
    expect(slideShift(0.3, 290.4)).toEqual({
      first: 'translate3d(-87px, 0, 0)',
      next: 'translate3d(203px, 0, 0)',
    });
  });

  it('두 화면 사이에 틈이 생기지 않는다 — 두 위치의 차이가 늘 내림한 화면 폭이라 살짝 겹친다', () => {
    for (const progress of [0.13, 0.37, 0.5, 0.71, 0.99]) {
      const { first, next } = slideShift(progress, 290.7);
      const px = (value: string) => Number(value.match(/\((-?\d+)px/)?.[1]);
      expect(px(next) - px(first)).toBe(290);
    }
  });
});
