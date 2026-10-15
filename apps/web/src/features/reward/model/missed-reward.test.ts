import { describe, expect, it } from 'vitest';

import type { RewardPreview } from '../api/reward';
import { missedRewardOf, missedRowsOf, pastDaysOf } from './missed-reward';

// 서울로 10월 15일 낮
const COMPUTED_AT = '2026-10-15T03:00:00Z';

const preview = (patch: Partial<RewardPreview> = {}): RewardPreview => ({
  balanceWon: 1000,
  completedDays: 2,
  todayEarnedWon: 0,
  dailyAmountWon: 500,
  accruing: true,
  ...patch,
});

describe('missedRewardOf', () => {
  it('미리보기가 없으면 놓친 환급액도 없다', () => {
    expect(missedRewardOf(null, COMPUTED_AT)).toBeNull();
  });

  it('오늘 아직이면 쌓인 날과 금액이 전부 지난 날의 몫이다', () => {
    const missed = missedRewardOf(preview(), COMPUTED_AT);

    expect(missed).toEqual({
      pastDays: 2,
      missedWon: 1000,
      talkedToday: false,
      dailyWon: 500,
      today: '2026-10-15',
    });
  });

  it('서버가 계산한 시각을 서울 날짜로 읽어 오늘로 삼는다 — 폰 시계를 쓰지 않는다', () => {
    // 서울로는 이미 16일 새벽이다
    const missed = missedRewardOf(preview(), '2026-10-15T15:30:00Z');

    expect(missed?.today).toBe('2026-10-16');
  });

  it('오늘 했으면 오늘 몫을 빼고 지난 날만 센다', () => {
    const missed = missedRewardOf(
      preview({ balanceWon: 1500, completedDays: 3, todayEarnedWon: 500 }),
      COMPUTED_AT,
    );

    expect(missed).toMatchObject({
      pastDays: 2,
      missedWon: 1000,
      talkedToday: true,
    });
  });

  it('지난 날이 2일보다 적으면 보여 주지 않는다', () => {
    const missed = missedRewardOf(
      preview({ balanceWon: 1000, completedDays: 2, todayEarnedWon: 500 }),
      COMPUTED_AT,
    );

    expect(missed).toBeNull();
  });
});

describe('pastDaysOf', () => {
  it('기준보다 적어도 지난 날수는 센다 — 계측이 일수 구간을 본다', () => {
    expect(pastDaysOf(preview({ completedDays: 1, todayEarnedWon: 500 }))).toBe(
      0,
    );
  });
});

describe('missedRowsOf', () => {
  const items = [
    { date: '2026-10-14', amountWon: 500 },
    { date: '2026-10-13', amountWon: 500 },
  ];

  it('기록에 오늘이 없으면 모든 줄이 못 받은 날이다', () => {
    expect(missedRowsOf(items, '2026-10-15')).toEqual([
      { id: '2026-10-14', dateLabel: '10.14', amountWon: 500, isToday: false },
      { id: '2026-10-13', dateLabel: '10.13', amountWon: 500, isToday: false },
    ]);
  });

  it('서버가 정한 오늘과 날짜가 같은 줄만 오늘로 적는다', () => {
    const rows = missedRowsOf(items, '2026-10-14');

    expect(rows.map((row) => [row.dateLabel, row.isToday])).toEqual([
      ['오늘', true],
      ['10.13', false],
    ]);
  });

  it('오늘을 모르면 어느 줄도 오늘로 적지 않는다', () => {
    const rows = missedRowsOf(items, null);

    expect(rows.some((row) => row.isToday)).toBe(false);
  });

  it('이어 받는 사이 같은 날이 두 번 오면 한 줄만 남긴다', () => {
    const rows = missedRowsOf([...items, items[1]], null);

    expect(rows).toHaveLength(2);
  });
});
