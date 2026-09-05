// 위젯 데이터 조립 검증 — 마지막 완료일 유도와 최근 7일 창 계산이 핵심 계약이다
import { describe, expect, it } from 'vitest';

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

describe('buildWidgetData — 마지막 완료일', () => {
  it('오늘 완료했으면 오늘이 마지막 완료일이 된다', () => {
    const data = buildWidgetData(streakOf({ activeToday: true }));

    expect(data.lastCompletedDate).toBe('2026-08-25');
    expect(data.todayDone).toBe(true);
  });

  it('스트릭이 살아있고 오늘만 아직이면 어제가 마지막 완료일이 된다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 5 }));

    expect(data.lastCompletedDate).toBe('2026-08-24');
    expect(data.todayDone).toBe(false);
  });

  it('스트릭이 끊긴 유저는 스트릭 달력에서 가장 최근 활동일을 찾는다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), [
      streakCalendarOf(['2026-08-20', '2026-08-21']),
    ]);

    expect(data.lastCompletedDate).toBe('2026-08-21');
  });

  it('지난달 달력에서도 찾는다 — 한 달 가까이 쉰 사람도 몇 일째인지 정확히 안다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), [
      streakCalendarOf([], '2026-07-30'),
      streakCalendarOf(['2026-07-30'], '2026-07-30', {
        year: 2026,
        month: 7,
      }),
    ]);

    expect(data.lastCompletedDate).toBe('2026-07-30');
  });

  it('조회 범위 어디에도 없으면 범위 시작 하루 전으로 잡는다 — 확실히 아는 최소 이탈일', () => {
    // 7·8월을 다 봤는데 없다 = 적어도 6월 30일 이전이 마지막이다.
    // 첫 완료일(1월 5일)은 "이력이 있다"는 사실만 알려줄 뿐 마지막 날이 아니다
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), [
      streakCalendarOf([], '2026-01-05'),
      streakCalendarOf([], '2026-01-05', { year: 2026, month: 7 }),
    ]);

    expect(data.lastCompletedDate).toBe('2026-06-30');
  });

  it('완료 이력이 아예 없는 신규 유저는 null이다 — 몰락 연출을 하지 않는다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), [
      streakCalendarOf([], null),
    ]);

    expect(data.lastCompletedDate).toBeNull();
  });

  it('달력 조회가 전부 실패해도 터지지 않고 null이 된다', () => {
    const data = buildWidgetData(streakOf({ currentStreakDays: 0 }), [
      null,
      null,
    ]);

    expect(data.lastCompletedDate).toBeNull();
  });
});

describe('buildWidgetData — 기준 날짜', () => {
  it('서버가 준 오늘을 기준 날짜로 싣는다 — 위젯이 날짜에 묶인 표시를 판정하는 근거다', () => {
    const data = buildWidgetData(streakOf());

    expect(data.capturedOn).toBe('2026-08-25');
  });
});

describe('buildWidgetData — 주간 완료 창', () => {
  it('오늘이 마지막 칸인 최근 7일을 스트릭 달력의 활동일로 채운다', () => {
    // 최근 7일: 08-19 ~ 08-25. 옛(끊긴) 스트릭의 활동일(19·20)도 사실대로 켜진다
    const data = buildWidgetData(streakOf({ activeToday: true }), [
      streakCalendarOf(['2026-08-19', '2026-08-20', '2026-08-24']),
    ]);

    expect(data.weeklyDone).toEqual([
      true, // 08-19
      true, // 08-20
      false, // 08-21 (활동 없음)
      false, // 08-22
      false, // 08-23
      true, // 08-24
      true, // 08-25 = activeToday
    ]);
  });

  it('최근 7일이 두 달에 걸치면 이번 달·지난달 달력을 합쳐 채운다', () => {
    // 오늘 08-03, 최근 7일: 07-28 ~ 08-03
    const data = buildWidgetData(streakOf({ today: '2026-08-03' }), [
      streakCalendarOf(['2026-08-01']),
      streakCalendarOf(['2026-07-29', '2026-07-30'], '2026-07-29', {
        year: 2026,
        month: 7,
      }),
    ]);

    expect(data.weeklyDone).toEqual([
      false, // 07-28
      true, // 07-29
      true, // 07-30
      false, // 07-31
      true, // 08-01
      false, // 08-02
      false, // 08-03 = activeToday
    ]);
  });

  it('오늘 칸은 /me/streak가 단일 출처다 — 달력에 오늘이 적혀 있어도 activeToday가 이긴다', () => {
    const data = buildWidgetData(streakOf({ activeToday: false }), [
      streakCalendarOf(['2026-08-25']),
    ]);

    expect(data.weeklyDone[6]).toBe(false);
  });

  it('달력 조회가 실패해도 위젯 데이터는 만들어진다 — 오늘 칸만 완료 여부를 안다', () => {
    const data = buildWidgetData(streakOf({ activeToday: true }), [null, null]);

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
