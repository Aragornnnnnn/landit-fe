// 칩 드래그 계산 검증 — 놓을 자리·순서 이동·기준점 보정
import { describe, expect, it } from 'vitest';

import { dropIndexAt, moveChip, shiftOrigin } from './chip-drag';

describe('moveChip', () => {
  it('앞의 칩을 뒤로 옮기면 사이 칩들이 앞으로 당겨진다', () => {
    expect(moveChip([0, 1, 2, 3], 0, 2)).toEqual([1, 2, 0, 3]);
  });

  it('뒤의 칩을 앞으로 옮기면 사이 칩들이 뒤로 밀린다', () => {
    expect(moveChip([0, 1, 2, 3], 3, 1)).toEqual([0, 3, 1, 2]);
  });

  it('제자리로 옮기면 순서가 그대로다', () => {
    expect(moveChip([0, 1, 2], 1, 1)).toEqual([0, 1, 2]);
  });
});

describe('dropIndexAt', () => {
  // 두 줄로 접힌 칩 배치 — 첫 줄에 두 칩, 둘째 줄에 한 칩
  const boxes = [
    { left: 0, top: 0, right: 60, bottom: 40 },
    { left: 70, top: 0, right: 130, bottom: 40 },
    { left: 0, top: 62, right: 60, bottom: 102 },
  ];

  it('포인터가 지나친 칩 수만큼 뒤 자리를 고른다', () => {
    expect(dropIndexAt(boxes, 2, { x: 65, y: 20 })).toBe(1);
  });

  it('아랫줄을 가리키면 가로 위치와 상관없이 윗줄 칩은 지난 것으로 센다', () => {
    // 윗줄 오른쪽 끝 칩(1번)보다 훨씬 왼쪽을 가리켜도 줄이 아래면 지난 것이다
    expect(dropIndexAt(boxes, 0, { x: 5, y: 80 })).toBe(1);
  });

  it('첫 칩보다 앞을 가리키면 첫 자리를 고른다', () => {
    expect(dropIndexAt(boxes, 2, { x: 5, y: 20 })).toBe(0);
  });

  it('끌고 있는 칩을 제자리에서 가리키면 그 자리가 그대로 나온다', () => {
    expect(dropIndexAt(boxes, 1, { x: 100, y: 20 })).toBe(1);
  });
});

describe('shiftOrigin', () => {
  it('칩 자리가 옮겨간 만큼 기준점도 같이 움직인다', () => {
    const before = { left: 100, top: 0, right: 160, bottom: 40 };
    const after = { left: 30, top: 62, right: 90, bottom: 102 };

    expect(shiftOrigin({ x: 200, y: 300 }, before, after)).toEqual({
      x: 130,
      y: 362,
    });
  });

  it('자리가 그대로면 기준점도 그대로다', () => {
    const box = { left: 10, top: 20, right: 70, bottom: 60 };

    expect(shiftOrigin({ x: 5, y: 5 }, box, box)).toEqual({ x: 5, y: 5 });
  });
});
