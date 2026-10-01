// 확대 보기 규칙 — 배율 단계, 더블탭, 핀치 범위, 이동 범위, 손가락 방향 판정
import { describe, expect, it } from 'vitest';

import {
  clampPan,
  clampScale,
  MAX_SCALE,
  MIN_SCALE,
  readSwipe,
  stepScale,
  toggleScale,
} from './image-zoom';

describe('stepScale', () => {
  it('+는 다음 정수 배율로 올린다', () => {
    expect(stepScale(1, 1)).toBe(2);
  });

  it('핀치로 멈춘 중간 배율에서 +를 누르면 바로 위 정수로 간다', () => {
    expect(stepScale(1.4, 1)).toBe(2);
  });

  it('−는 바로 아래 정수로 내린다', () => {
    expect(stepScale(2.6, -1)).toBe(2);
  });

  it('끝에서는 더 가지 않는다', () => {
    expect(stepScale(MAX_SCALE, 1)).toBe(MAX_SCALE);
    expect(stepScale(MIN_SCALE, -1)).toBe(MIN_SCALE);
  });
});

describe('toggleScale', () => {
  it('원래 크기면 2배로 키운다', () => {
    expect(toggleScale(1)).toBe(2);
  });

  it('조금이라도 커져 있으면 원래 크기로 돌린다', () => {
    expect(toggleScale(2.8)).toBe(1);
  });
});

describe('clampScale', () => {
  it('핀치로 범위를 넘어도 1~3배 안에 둔다', () => {
    expect(clampScale(0.4)).toBe(MIN_SCALE);
    expect(clampScale(5)).toBe(MAX_SCALE);
    expect(clampScale(1.7)).toBe(1.7);
  });
});

describe('clampPan', () => {
  const frame = { width: 400, height: 800 };
  const fitted = { width: 400, height: 300 };

  it('원래 크기면 움직이지 않는다', () => {
    expect(clampPan({ x: 50, y: 50 }, 1, fitted, frame)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('커진 만큼만 움직이고 가장자리를 넘기지 않는다', () => {
    // 2배면 가로 800 — 화면 400을 빼면 양쪽으로 200까지. 세로 600은 화면 800보다 작아 가운데에 둔다
    expect(clampPan({ x: 500, y: 90 }, 2, fitted, frame)).toEqual({
      x: 200,
      y: 0,
    });
  });
});

describe('readSwipe', () => {
  it('원래 크기에서 왼쪽으로 크게 밀면 다음 사진이다', () => {
    expect(readSwipe({ dx: -120, dy: 10 }, 1)).toBe('next');
  });

  it('원래 크기에서 오른쪽으로 크게 밀면 이전 사진이다', () => {
    expect(readSwipe({ dx: 120, dy: -8 }, 1)).toBe('prev');
  });

  it('원래 크기에서 아래로 크게 쓸면 닫는다', () => {
    expect(readSwipe({ dx: 10, dy: 160 }, 1)).toBe('close');
  });

  it('조금 움직인 것은 아무것도 아니다', () => {
    expect(readSwipe({ dx: -30, dy: 20 }, 1)).toBeNull();
  });

  it('확대한 상태의 드래그는 사진 이동이라 넘기거나 닫지 않는다', () => {
    expect(readSwipe({ dx: -300, dy: 0 }, 2)).toBeNull();
    expect(readSwipe({ dx: 0, dy: 300 }, 2)).toBeNull();
  });
});
