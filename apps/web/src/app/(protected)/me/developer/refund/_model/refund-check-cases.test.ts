// 환급 점검의 가짜 내역 — 화면 위 금액과 맞물리는지
import { describe, expect, it } from 'vitest';

import { fakeHistoryItems, RECORD_CASES } from './refund-check-cases';

describe('fakeHistoryItems', () => {
  it('맨 윗줄 잔액이 화면 위의 쌓인 금액과 같다', () => {
    const { reward } = RECORD_CASES.partly;

    const [top] = fakeHistoryItems(reward);

    expect(top.balanceWon).toBe(reward.current?.balanceWon);
  });

  it('잔액이 바닥나는 데서 멈춘다 — 잔액이 음수인 줄을 만들지 않는다', () => {
    const items = fakeHistoryItems(RECORD_CASES.partly.reward);

    const first = items.at(-1)!;
    expect(first.balanceWon - first.amountWon).toBeGreaterThanOrEqual(0);
  });

  it('어제 쉬었으면 맨 위에 사라진 금액만큼의 하루 쉼 줄을 둔다', () => {
    const { reward } = RECORD_CASES.reset;

    const [top, next] = fakeHistoryItems(reward);

    expect(top).toMatchObject({
      type: 'RESET',
      amountWon: -reward.lostYesterdayWon,
      balanceWon: 0,
    });
    expect(next.balanceWon).toBe(reward.lostYesterdayWon);
  });

  it('줄마다 열쇠가 다르다', () => {
    const items = fakeHistoryItems(RECORD_CASES.ended.reward);

    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });
});
