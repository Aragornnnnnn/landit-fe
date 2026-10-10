// 환급 내역 줄의 계약 테스트
import { describe, expect, it } from 'vitest';

import type { RewardHistoryItem } from '../api/reward';
import { historyRowsOf, nextHistoryCursor } from './reward-history';

const item = (patch: Partial<RewardHistoryItem> = {}): RewardHistoryItem => ({
  id: '2:00000000000000000812',
  type: 'EARN',
  activityType: 'EXPRESSION',
  date: '2026-10-10',
  occurredAt: '2026-10-10T08:24:11+09:00',
  amountWon: 11,
  balanceWon: 2015,
  cycleId: 7,
  completionId: 4410,
  ...patch,
});

describe('historyRowsOf', () => {
  it('적립은 무엇을 끝냈는지와 끝낸 시각을 말한다', () => {
    expect(historyRowsOf([item()])).toEqual([
      {
        id: '2:00000000000000000812',
        dateLabel: '10.10',
        title: '표현학습 완료',
        note: '08:24',
        amountWon: 11,
        balanceWon: 2015,
      },
    ]);
  });

  it('활동마다 제목이 다르다', () => {
    const rows = historyRowsOf([
      item({ id: '3', activityType: 'SMALLTALK' }),
      item({ id: '2', activityType: 'EXPRESSION' }),
      item({ id: '1', activityType: 'SCENARIO' }),
    ]);

    expect(rows.map((row) => row.title)).toEqual([
      '스몰톡 완료',
      '표현학습 완료',
      '시나리오 대화 완료',
    ]);
  });

  it('끝낸 시각은 서버가 어느 시간대로 주든 한국 시각으로 적는다', () => {
    const [row] = historyRowsOf([item({ occurredAt: '2026-10-09T23:24:11Z' })]);

    expect(row.note).toBe('08:24');
  });

  it('시간대 표시 없이 온 시각은 한국 시각으로 읽는다', () => {
    const [row] = historyRowsOf([item({ occurredAt: '2026-10-10T08:24:11' })]);

    expect(row.note).toBe('08:24');
  });

  it('날짜는 그날의 첫 줄에만 적는다', () => {
    const rows = historyRowsOf([
      item({ id: '3', date: '2026-10-10' }),
      item({ id: '2', date: '2026-10-10' }),
      item({ id: '1', date: '2026-10-09' }),
    ]);

    expect(rows.map((row) => row.dateLabel)).toEqual(['10.10', null, '10.9']);
  });

  it('연속 학습 끊김은 시각 대신 초기화됐다고 말하고 금액은 음수 그대로 둔다', () => {
    // given — 초기화는 다음 날 0시에 일어나지만 쉰 날에 붙는다
    const [row] = historyRowsOf([
      item({
        type: 'RESET',
        activityType: null,
        date: '2026-10-09',
        occurredAt: '2026-10-10T00:00:00+09:00',
        amountWon: -1550,
        balanceWon: 0,
        completionId: null,
      }),
    ]);

    expect(row).toMatchObject({
      dateLabel: '10.9',
      title: '연속 학습 끊김',
      note: '연속 학습이 끊겨서 누적 환급액이 초기화됐어요',
      amountWon: -1550,
      balanceWon: 0,
    });
  });

  it('기간 종료는 금액 칸을 비우고 그 회차의 최종 금액만 남긴다', () => {
    const [row] = historyRowsOf([
      item({
        type: 'CYCLE_END',
        activityType: null,
        amountWon: 0,
        balanceWon: 31920,
        completionId: null,
      }),
    ]);

    expect(row).toMatchObject({
      title: '기간 종료',
      amountWon: null,
      balanceWon: 31920,
    });
  });

  it('모르는 활동으로 받은 돈은 건너뛰지 않고 뭉뚱그려 적는다', () => {
    // given — 건너뛰면 잔액이 설명 없이 뛴다
    const [row] = historyRowsOf([
      item({
        activityType: 'REVIEW_QUIZ' as RewardHistoryItem['activityType'],
      }),
    ]);

    expect(row).toMatchObject({ title: '학습 완료', amountWon: 11 });
  });

  it('끝낸 시각을 읽을 수 없는 줄은 시각만 비운다', () => {
    const [row] = historyRowsOf([item({ occurredAt: '' })]);

    expect(row).toMatchObject({ title: '표현학습 완료', note: '' });
  });

  it('모르는 종류의 줄은 건너뛴다', () => {
    const rows = historyRowsOf([
      item({ id: '2', type: 'PAYOUT', activityType: null }),
      item({ id: '1' }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['1']);
  });

  it('이어 받는 사이 같은 줄이 두 번 와도 한 번만 그린다', () => {
    const rows = historyRowsOf([
      item({ id: '2' }),
      item({ id: '1' }),
      item({ id: '1' }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['2', '1']);
  });

  it('건너뛴 줄 때문에 그날의 날짜가 사라지지 않는다', () => {
    const rows = historyRowsOf([
      item({ id: '2', type: 'PAYOUT', activityType: null }),
      item({ id: '1' }),
    ]);

    expect(rows[0].dateLabel).toBe('10.10');
  });
});

describe('nextHistoryCursor', () => {
  it('서버가 준 커서로 다음 장을 묻는다', () => {
    expect(
      nextHistoryCursor({ items: [item()], nextCursor: 'p2' }, [null]),
    ).toBe('p2');
  });

  it('더 없으면 묻지 않는다', () => {
    expect(
      nextHistoryCursor({ items: [item()], nextCursor: null }, [null, 'p2']),
    ).toBeUndefined();
  });

  it('빈 커서는 끝으로 친다 — 빈 커서로 부르면 첫 장을 또 받는다', () => {
    expect(
      nextHistoryCursor({ items: [item()], nextCursor: '' }, [null, 'p2']),
    ).toBeUndefined();
  });

  it('방금 물은 커서를 그대로 되돌려 주면 끝으로 친다 — 같은 장을 끝없이 받게 된다', () => {
    expect(
      nextHistoryCursor({ items: [item()], nextCursor: 'p2' }, [null, 'p2']),
    ).toBeUndefined();
  });

  it('앞서 물은 커서로 되돌아가도 끝으로 친다 — 두 장을 끝없이 오간다', () => {
    expect(
      nextHistoryCursor({ items: [item()], nextCursor: 'p2' }, [
        null,
        'p2',
        'p3',
      ]),
    ).toBeUndefined();
  });
});
