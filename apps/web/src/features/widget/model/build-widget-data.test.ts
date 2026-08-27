// 위젯 데이터 조립 검증 — 마지막 완료일 유도와 최근 7일 창 계산이 핵심 계약이다
import { describe, expect, it } from 'vitest';

import type { ScenarioCalendarResponse } from '@/features/scenario/api/calendar';
import type { StreakCalendarResponse } from '@/features/streak/api/streak';

import { buildWidgetData } from './build-widget-data';

const streakOf = (
  over: Partial<Parameters<typeof buildWidgetData>[0]> = {},
) => ({
  currentStreakDays: 5,
  activeToday: false,
  today: '2026-08-25',
  ...over,
});

const streakCalendarOf = (
  activeDates: string[],
  firstActiveDate: string | null = activeDates[0] ?? null,
  { year, month }: { year: number; month: number } = { year: 2026, month: 8 },
): StreakCalendarResponse => ({
  year,
  month,
  currentStreakDays: 0,
  activeToday: false,
  today: '2026-08-25',
  firstActiveDate,
  longestStreakDays: 3,
  totalActiveDays: activeDates.length,
  activeDates,
});

const calendarOf = (
  days: Array<[string, boolean]>,
  startedAt: string | null = '2026-08-01',
): ScenarioCalendarResponse => ({
  type: 'WEEK',
  date: '2026-08-25',
  label: '2026년 8월 4주차',
  today: '2026-08-25',
  startedAt,
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

  it('완료 이력이 전혀 없으면(startedAt null) 마지막 완료일이 null이다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), null, [
      calendarOf([['2026-08-24', false]], null),
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

  it('달력 조회가 실패해도 위젯 데이터는 만들어진다 — 오늘 칸만 완료 여부를 안다', () => {
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

  it('주간 창 밖이어도 이번 달 완료 기록에서 마지막 완료일을 찾는다', () => {
    // 8월 3일에 마지막 완료 — 최근 2주(8/12~8/25) 밖이지만 이번 달 안이다
    const data = buildWidgetData(
      { currentStreakDays: 0, activeToday: false, today: '2026-08-25' },
      null,
      [calendarOf([]), calendarOf([])],
      [streakCalendarOf(['2026-08-01', '2026-08-03'])],
    );

    expect(data.lastCompletedDate).toBe('2026-08-03');
  });

  it('지난달 달력에서도 찾는다 — 한 달 가까이 쉰 사람도 몇 일째인지 정확히 안다', () => {
    const data = buildWidgetData(
      { currentStreakDays: 0, activeToday: false, today: '2026-08-25' },
      null,
      [calendarOf([]), calendarOf([])],
      [
        streakCalendarOf([], '2026-07-30'),
        streakCalendarOf(['2026-07-30'], '2026-07-30', {
          year: 2026,
          month: 7,
        }),
      ],
    );

    expect(data.lastCompletedDate).toBe('2026-07-30');
  });

  it('조회 범위 어디에도 없으면 범위 시작 하루 전으로 잡는다 — 확실히 아는 최소 이탈일', () => {
    // 7·8월을 다 봤는데 없다 = 적어도 6월 30일 이전이 마지막이다.
    // 첫 완료일(1월 5일)은 "이력이 있다"는 사실만 알려줄 뿐 마지막 날이 아니다
    const data = buildWidgetData(
      { currentStreakDays: 0, activeToday: false, today: '2026-08-25' },
      null,
      [calendarOf([], null), calendarOf([], null)],
      [
        streakCalendarOf([], '2026-01-05'),
        streakCalendarOf([], '2026-01-05', { year: 2026, month: 7 }),
      ],
    );

    expect(data.lastCompletedDate).toBe('2026-06-30');
  });

  it('완료 이력이 아예 없는 신규 유저는 null이다 — 몰락 연출을 하지 않는다', () => {
    const data = buildWidgetData(
      { currentStreakDays: 0, activeToday: false, today: '2026-08-25' },
      null,
      [calendarOf([], null), calendarOf([], null)],
      [streakCalendarOf([], null)],
    );

    expect(data.lastCompletedDate).toBeNull();
  });

  it('오늘 카드 제목이 비어 있으면 null로 보낸다 — 빈 문자열은 브릿지 스키마가 거부해 위젯 데이터 전체가 버려진다', () => {
    const data = buildWidgetData(
      { currentStreakDays: 3, activeToday: false, today: '2026-08-25' },
      { scenario: { scenarioTitle: '   ' } } as never,
      [calendarOf([]), calendarOf([])],
    );

    expect(data.todayCardTitle).toBeNull();
  });
});
