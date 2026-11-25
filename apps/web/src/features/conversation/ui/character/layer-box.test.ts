// 층 상자를 제 그림 영역만큼만 잡는 계산이 그림 자리를 그대로 지키는지 확인한다
import { describe, expect, it } from 'vitest';

import {
  clipArea,
  placeArea,
  readArea,
  toViewBox,
  unionAreas,
} from './layer-box';

describe('clipArea', () => {
  it('그림 영역이 그릴 영역 밖으로 나가면 안쪽만 남긴다', () => {
    // Given — 상반신 영역 아래로 몸통이 길게 뻗어 있다
    const frame = { x: 0, y: 0, width: 400, height: 600 };
    const torso = { x: 50, y: 300, width: 300, height: 900 };

    // When
    const clipped = clipArea(torso, frame);

    // Then
    expect(clipped).toEqual({ x: 50, y: 300, width: 300, height: 300 });
  });

  it('그림 영역이 그릴 영역과 겹치지 않으면 없다', () => {
    const frame = { x: 0, y: 0, width: 400, height: 600 };
    const legs = { x: 50, y: 700, width: 300, height: 200 };

    expect(clipArea(legs, frame)).toBeNull();
  });
});

describe('unionAreas', () => {
  it('여러 층을 한 상자로 묶으면 모두를 덮는 가장 작은 영역이 된다', () => {
    const union = unionAreas([
      { x: 10, y: 20, width: 30, height: 40 },
      { x: 0, y: 50, width: 20, height: 30 },
    ]);

    expect(union).toEqual({ x: 0, y: 20, width: 40, height: 60 });
  });
});

describe('placeArea', () => {
  it('상자는 부모 영역 기준 %로 놓여, 원래 한 장에서와 같은 자리를 차지한다', () => {
    // Given — 부모(100,200 400×800) 안 (200,400)에서 100×200
    const parent = { x: 100, y: 200, width: 400, height: 800 };
    const area = { x: 200, y: 400, width: 100, height: 200 };

    // When
    const place = placeArea(area, parent);

    // Then
    expect(place).toEqual({
      left: '25%',
      top: '25%',
      width: '25%',
      height: '25%',
    });
  });
});

describe('readArea / toViewBox', () => {
  it('viewBox 문자열과 영역은 서로 그대로 오간다', () => {
    const viewBox = '292 40 440 610';

    expect(toViewBox(readArea(viewBox))).toBe(viewBox);
  });
});
