// 시각 휠 — 24시 시각과 휠 세 칸(오전/오후·시·분) 사이를 오가고, 도는 칸의 위치를 값으로 읽는다
import { describe, expect, it } from 'vitest';

import { fromWheel, meridiemAfter, rowStep, toWheel } from './time-wheel';

describe('toWheel / fromWheel', () => {
  it.each([
    ['자정', 0, 0, 12],
    ['오전 7시', 0, 7, 7],
    ['정오', 1, 12, 12],
    ['오후 7시', 1, 19, 7],
  ] as const)(
    '%s를 휠로 바꿨다가 되돌리면 같은 시각이다',
    (_, meridiem, hour, hour12) => {
      const wheel = toWheel({ hour, minute: 25 });

      expect(wheel).toEqual({ meridiem, hour12, minute: 25 });
      expect(fromWheel(wheel)).toEqual({ hour, minute: 25 });
    },
  );
});

describe('rowStep', () => {
  it('한 칸 아래로 가면 1이다', () => {
    expect(rowStep(4, 5, 12)).toBe(1);
  });

  it('라이브러리가 목록을 한 바퀴 되감아도(5 → 6-12) 실제로 움직인 한 칸으로 읽는다', () => {
    expect(rowStep(17, 6, 12)).toBe(1);
  });

  it('위로 되감긴 경우도 실제로 움직인 칸 수다', () => {
    expect(rowStep(0, 11, 12)).toBe(-1);
  });
});

describe('meridiemAfter — 시 칸이 12시 경계를 지난 횟수로 오전/오후를 정한다', () => {
  // 시 칸의 칸 번호: 1시=0 … 11시=10, 12시=11 (12칸마다 되풀이)
  it.each([
    ['9시에서 12시로 내려가면 바뀐다', 0, 8, 11, 1],
    ['12시까지 갔다가 11시로 돌아오면 그대로다', 0, 8, 10, 0],
    ['12시를 지나 다음 날 같은 9시까지 한 바퀴 돌면 바뀐다', 0, 8, 20, 1],
    ['12시를 거꾸로(12 → 11) 지나도 바뀐다', 1, 8, -4, 0],
    ['12시에서 1시로 가는 건 경계가 아니다', 1, 11, 12, 1],
    ['경계를 두 번 지나면 원래대로다', 0, 8, 32, 0],
  ] as const)('%s', (_, start, fromRow, toRow, expected) => {
    expect(meridiemAfter(start, fromRow, toRow)).toBe(expected);
  });
});
