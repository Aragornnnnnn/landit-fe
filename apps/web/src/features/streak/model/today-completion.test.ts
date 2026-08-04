// 오늘 완료를 캐시에 미리 반영하는 규칙의 계약 테스트
// 서버 응답을 기다렸다 바꾸면 화면이 옛 숫자를 먼저 보여주고 뒤늦게 번쩍인다
import { describe, expect, it } from 'vitest';

import type { StreakCalendarResponse } from '../api/streak';
import {
  calendarWithTodayCompleted,
  withTodayCompleted,
} from './today-completion';

describe('withTodayCompleted', () => {
  it('오늘이 아직이었으면 하루 늘고 오늘 완료가 된다', () => {
    expect(
      withTodayCompleted({ currentStreakDays: 6, activeToday: false }),
    ).toEqual({ currentStreakDays: 7, activeToday: true });
  });

  it('오늘을 이미 했으면 그대로다', () => {
    // given — 같은 날 두 번 완료해도 활동일은 한 번만 센다 (백엔드와 같은 규칙)

    // when + then
    expect(
      withTodayCompleted({ currentStreakDays: 7, activeToday: true }),
    ).toEqual({ currentStreakDays: 7, activeToday: true });
  });

  it('끊겨 있었으면 1일이 된다', () => {
    expect(
      withTodayCompleted({ currentStreakDays: 0, activeToday: false }),
    ).toEqual({ currentStreakDays: 1, activeToday: true });
  });
});

const calendar = (
  overrides: Partial<StreakCalendarResponse> = {},
): StreakCalendarResponse => ({
  year: 2026,
  month: 8,
  currentStreakDays: 6,
  activeToday: false,
  streakStartedDate: '2026-06-01',
  longestStreakDays: 12,
  totalActiveDays: 25,
  activeDates: ['2026-08-01', '2026-08-02'],
  ...overrides,
});

describe('calendarWithTodayCompleted', () => {
  it('보고 있는 달이 오늘이 든 달이면 활동일에 오늘을 넣는다', () => {
    // when — 8월 달력을 보는 중에 8월 4일을 완료했다
    const next = calendarWithTodayCompleted(calendar(), '2026-08-04');

    // then
    expect(next.activeDates).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-04',
    ]);
    expect(next.currentStreakDays).toBe(7);
    expect(next.activeToday).toBe(true);
    expect(next.totalActiveDays).toBe(26);
  });

  it('다른 달을 보고 있으면 날짜는 안 넣고 요약만 고친다', () => {
    // given — 7월을 펼쳐 둔 채 오늘(8월 4일)을 완료했다
    const july = calendar({ month: 7, activeDates: ['2026-07-30'] });

    // when
    const next = calendarWithTodayCompleted(july, '2026-08-04');

    // then — 7월 칸에 8월 날짜를 넣으면 안 된다. 요약 숫자는 달과 무관하므로 따라간다
    expect(next.activeDates).toEqual(['2026-07-30']);
    expect(next.currentStreakDays).toBe(7);
    expect(next.totalActiveDays).toBe(26);
  });

  it('오늘이 이미 활동일에 있으면 아무것도 늘리지 않는다', () => {
    // given — 같은 날 두 번째 완료
    const done = calendar({
      activeToday: true,
      currentStreakDays: 7,
      activeDates: ['2026-08-01', '2026-08-04'],
    });

    // when
    const next = calendarWithTodayCompleted(done, '2026-08-04');

    // then
    expect(next.activeDates).toEqual(['2026-08-01', '2026-08-04']);
    expect(next.totalActiveDays).toBe(25);
    expect(next.currentStreakDays).toBe(7);
  });

  it('최장 기록을 넘어서면 최장도 같이 올라간다', () => {
    // given — 최장 6일인데 오늘로 7일째가 된다
    const tying = calendar({ longestStreakDays: 6 });

    // when + then
    expect(
      calendarWithTodayCompleted(tying, '2026-08-04').longestStreakDays,
    ).toBe(7);
  });
});
