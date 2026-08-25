// 위젯 스냅샷 조립 검증 — 마지막 완료일 유도와 최근 7일 창 계산이 핵심 계약이다
import { describe, expect, it } from 'vitest';

import type { ScenarioCalendarResponse } from '@/features/scenario/api/calendar';

import { buildWidgetData } from './build-widget-data';

const streakOf = (
  over: Partial<Parameters<typeof buildWidgetData>[0]> = {},
) => ({
  currentStreakDays: 5,
  activeToday: false,
  today: '2026-08-25',
  ...over,
});

const calendarOf = (
  days: Array<[string, boolean]>,
): ScenarioCalendarResponse => ({
  type: 'WEEK',
  date: '2026-08-25',
  label: '2026년 8월 4주차',
  today: '2026-08-25',
  startedAt: '2026-08-01',
  days: days.map(([date, completed]) => ({
    date,
    completed,
    scenarioId: completed ? 1 : null,
    thumbnailUrl: null,
  })),
});

const dailyOf = (title: string | null) =>
  title === null
    ? null
    : ({
        date: '2026-08-25',
        playable: true,
        scenario: { scenarioTitle: title },
      } as never);

describe('buildWidgetData — 마지막 완료일', () => {
  it('오늘 완료했으면 오늘이 마지막 완료일이 된다', () => {
    const data = buildWidgetData(
      streakOf({ activeToday: true }),
      dailyOf('룸메이트와 첫인사'),
      [],
    );

    expect(data.lastCompletedDate).toBe('2026-08-25');
    expect(data.todayDone).toBe(true);
  });

  it('스트릭이 살아있고 오늘만 아직이면 어제가 마지막 완료일이 된다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 5 }), null, []);

    expect(data.lastCompletedDate).toBe('2026-08-24');
    expect(data.todayDone).toBe(false);
  });

  it('스트릭이 끊긴 유저는 달력에서 가장 최근 완료일을 찾는다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), null, [
      calendarOf([
        ['2026-08-20', true],
        ['2026-08-21', true],
        ['2026-08-22', false],
      ]),
    ]);

    expect(data.lastCompletedDate).toBe('2026-08-21');
  });

  it('완료 이력이 전혀 없으면 마지막 완료일이 null이다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), null, [
      calendarOf([['2026-08-24', false]]),
    ]);

    expect(data.lastCompletedDate).toBeNull();
  });
});

describe('buildWidgetData — 주간 완료 창', () => {
  it('오늘이 마지막 칸인 최근 7일을 두 주 창에서 합쳐 만든다', () => {
    // 최근 7일: 08-19 ~ 08-25. 지난주 창(19·20)과 이번 주 창(24·25)에 흩어져 있다
    const data = buildWidgetData(streakOf({ activeToday: true }), null, [
      calendarOf([
        ['2026-08-24', true],
        ['2026-08-25', false], // 서버 달력이 낡아도 activeToday가 오늘 칸을 이긴다
      ]),
      calendarOf([
        ['2026-08-19', true],
        ['2026-08-20', true],
      ]),
    ]);

    expect(data.weeklyDone).toEqual([
      true, // 08-19
      true, // 08-20
      false, // 08-21 (달력에 없음)
      false, // 08-22
      false, // 08-23
      true, // 08-24
      true, // 08-25 = activeToday
    ]);
  });

  it('달력 조회가 실패해도 스냅샷은 만들어진다 — 오늘 칸만 완료 여부를 안다', () => {
    const data = buildWidgetData(streakOf({ activeToday: true }), null, [
      null,
      null,
    ]);

    expect(data.weeklyDone).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });
});

describe('buildWidgetData — 오늘 카드', () => {
  it('오늘 카드 제목을 부제로 담는다', () => {
    const data = buildWidgetData(streakOf(), dailyOf('룸메이트와 첫인사'), []);

    expect(data.todayCardTitle).toBe('룸메이트와 첫인사');
  });

  it('오늘 카드가 없으면 제목이 null이다', () => {
    const data = buildWidgetData(streakOf(), null, []);

    expect(data.todayCardTitle).toBeNull();
  });
});
