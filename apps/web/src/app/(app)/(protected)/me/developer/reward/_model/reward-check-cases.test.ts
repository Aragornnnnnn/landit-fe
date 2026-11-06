// 환급 점검의 케이스와 가짜 내역 — 화면 위 금액과 맞물리는지
import { describe, expect, it } from 'vitest';

import {
  fakeHistoryItems,
  readCheckCase,
  RECORD_CASES,
} from './reward-check-cases';

const TODAY = '2026-10-10';
const todayWon = (name: keyof typeof RECORD_CASES) =>
  fakeHistoryItems(RECORD_CASES[name].reward)
    .filter((item) => item.date === TODAY)
    .reduce((sum, item) => sum + item.amountWon, 0);

describe('readCheckCase', () => {
  it.each([['kept'], ['intro'], ['missed'], ['loading'], ['coin'], ['earned']])(
    '아는 케이스 %s는 그대로 읽는다',
    (name) => {
      expect(readCheckCase(name)).toBe(name);
    },
  );

  it.each([['없는-케이스'], ['constructor'], ['']])(
    '모르는 값 "%s"는 케이스로 치지 않는다',
    (raw) => {
      expect(readCheckCase(raw)).toBeNull();
    },
  );

  it('주소에 케이스가 없으면 null이다', () => {
    expect(readCheckCase(null)).toBeNull();
  });
});

describe('fakeHistoryItems', () => {
  it('맨 윗줄 잔액이 화면 위의 쌓인 금액과 같다', () => {
    const { reward } = RECORD_CASES.kept;

    const [top] = fakeHistoryItems(reward);

    expect(top.balanceWon).toBe(reward.current?.balanceWon);
  });

  it.each([
    ['yet' as const, 0],
    ['kept' as const, 500],
  ])('%s 케이스의 오늘 줄 합이 오늘 받은 금액과 같다', (name, earnedWon) => {
    expect(todayWon(name)).toBe(earnedWon);
  });

  it('하루에 한 줄만 쌓인다 — 오늘의 시나리오는 하루 한 번이다', () => {
    const items = fakeHistoryItems(RECORD_CASES.kept.reward);

    expect(new Set(items.map((item) => item.date)).size).toBe(items.length);
  });

  it('잔액이 바닥나는 데서 멈춘다 — 잔액이 음수인 줄을 만들지 않는다', () => {
    const items = fakeHistoryItems(RECORD_CASES.kept.reward);

    const oldest = items.at(-1)!;
    expect(oldest.balanceWon - oldest.amountWon).toBeGreaterThanOrEqual(0);
  });

  it.each([['first' as const], ['pending' as const]])(
    '쌓인 게 없는 %s 케이스는 한 줄도 만들지 않는다',
    (name) => {
      expect(fakeHistoryItems(RECORD_CASES[name].reward)).toEqual([]);
    },
  );

  it('기간이 끝났으면 맨 위에 넘어간 금액을 알리는 줄을 둔다', () => {
    const { reward } = RECORD_CASES.ended;

    const [top] = fakeHistoryItems(reward);

    expect(top).toMatchObject({
      type: 'CYCLE_END',
      balanceWon: reward.pendingRefundWon,
    });
  });

  it('줄마다 열쇠가 다르다', () => {
    const items = fakeHistoryItems(RECORD_CASES.ended.reward);

    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });
});
