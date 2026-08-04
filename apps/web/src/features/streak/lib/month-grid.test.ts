// 월 격자와 월 이동 한계의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  buildMonthGrid,
  canGoBack,
  canGoForward,
  shiftMonth,
} from './month-grid';

describe('buildMonthGrid', () => {
  it('첫날이 놓인 요일만큼 앞을 비우고 일요일부터 채운다', () => {
    // given — 2026년 8월 1일은 토요일

    // when
    const weeks = buildMonthGrid({ year: 2026, month: 8 });

    // then — 첫 주는 앞 6칸이 비고 마지막 칸이 1일이다
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      '2026-08-01',
    ]);
  });

  it('모든 주가 7칸이고 마지막 날 뒤는 비운다', () => {
    // when — 2026년 8월은 31일까지, 8월 31일은 월요일
    const weeks = buildMonthGrid({ year: 2026, month: 8 });
    const last = weeks[weeks.length - 1];

    // then
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(last[0]).toBe('2026-08-30');
    expect(last[1]).toBe('2026-08-31');
    expect(last[2]).toBeNull();
  });

  it('그 달의 날짜를 하나도 빠뜨리지 않는다', () => {
    // when — 2026년 2월(28일)
    const weeks = buildMonthGrid({ year: 2026, month: 2 });
    const days = weeks.flat().filter(Boolean);

    // then
    expect(days).toHaveLength(28);
    expect(days[0]).toBe('2026-02-01');
    expect(days[27]).toBe('2026-02-28');
  });
});

describe('shiftMonth', () => {
  it.each([
    [{ year: 2026, month: 1 }, -1, { year: 2025, month: 12 }],
    [{ year: 2026, month: 12 }, 1, { year: 2027, month: 1 }],
    [{ year: 2026, month: 8 }, -1, { year: 2026, month: 7 }],
  ])(
    '%o에서 %i달 옮기면 연도 경계를 넘어도 맞는 달이 된다',
    (view, direction, expected) => {
      expect(shiftMonth(view, direction as -1 | 1)).toEqual(expected);
    },
  );
});

describe('canGoForward', () => {
  it('보고 있는 달이 이번 달이면 더 갈 수 없다', () => {
    // given — 오늘이 2026년 8월 3일인데 8월을 보고 있다

    // when + then — 미래는 조회할 게 없다
    expect(canGoForward({ year: 2026, month: 8 }, '2026-08-03')).toBe(false);
  });

  it('지난 달을 보고 있으면 앞으로 갈 수 있다', () => {
    expect(canGoForward({ year: 2026, month: 7 }, '2026-08-03')).toBe(true);
  });
});

describe('canGoBack', () => {
  it('첫 기록이 있는 달까지만 뒤로 간다', () => {
    // given — 첫 완료일이 2026년 6월 20일

    // when + then — 7월에선 갈 수 있고, 6월에선 더 갈 곳이 없다
    expect(canGoBack({ year: 2026, month: 7 }, '2026-06-20')).toBe(true);
    expect(canGoBack({ year: 2026, month: 6 }, '2026-06-20')).toBe(false);
  });

  it('기록이 아예 없으면 뒤로 갈 수 없다', () => {
    // given — 신규 유저라 첫 완료일이 없다

    // when + then — 빈 달을 무한히 넘길 이유가 없다
    expect(canGoBack({ year: 2026, month: 8 }, null)).toBe(false);
  });
});
