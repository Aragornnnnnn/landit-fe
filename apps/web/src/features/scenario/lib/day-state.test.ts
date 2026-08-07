// 달력 칸 상태 판정 검증 — 놓친 날과 그릴 것이 없는 날을 가르는 게 계약이다
import { describe, expect, it } from 'vitest';

import type { ScenarioCalendarDay } from '../api/calendar';
import { dayStateOf, isOpenable } from './day-state';

const TODAY = '2026-08-02';
const STARTED_AT = '2026-07-13';

const day = (
  date: string,
  overrides: Partial<ScenarioCalendarDay> = {},
): ScenarioCalendarDay => ({
  date,
  completed: false,
  scenarioId: null,
  thumbnailUrl: null,
  ...overrides,
});

const stateOf = (date: string, overrides?: Partial<ScenarioCalendarDay>) =>
  dayStateOf(day(date, overrides), { today: TODAY, startedAt: STARTED_AT });

describe('dayStateOf', () => {
  it('완료한 날은 오늘이든 지난 날이든 완료로 본다', () => {
    // Given 그날 대화를 끝낸 기록이 있을 때
    // When 칸 상태를 정하면
    // Then 사진이 들어갈 완료 칸이 된다
    expect(stateOf('2026-07-20', { completed: true })).toBe('completed');
    expect(stateOf(TODAY, { completed: true })).toBe('completed');
  });

  it('아직 안 깬 오늘은 오늘 칸이다', () => {
    expect(stateOf(TODAY)).toBe('today');
  });

  it('시작일 이후로 지나갔는데 비어 있으면 놓친 날이다', () => {
    expect(stateOf('2026-07-22')).toBe('missed');
  });

  it('기록이 시작되기 전은 놓친 날이 아니다', () => {
    // Given 첫 완료일보다 앞선 날에서
    // When 칸 상태를 정하면
    // Then 안 한 게 아니라 해당이 없던 날이라 빈 칸이 된다
    expect(stateOf('2026-07-01')).toBe('blank');
  });

  it('아직 오지 않은 날도 빈 칸이다', () => {
    expect(stateOf('2026-08-09')).toBe('blank');
  });

  it('기록이 아예 없으면 지난 날을 놓친 날로 본다', () => {
    // 신규 사용자는 startedAt이 null이다 — 앞을 비워둘 기준이 없다
    expect(
      dayStateOf(day('2026-07-01'), { today: TODAY, startedAt: null }),
    ).toBe('missed');
  });
});

describe('isOpenable', () => {
  it('완료한 날과 오늘만 카드를 연다', () => {
    expect(isOpenable('completed')).toBe(true);
    expect(isOpenable('today')).toBe(true);
    expect(isOpenable('missed')).toBe(false);
    expect(isOpenable('blank')).toBe(false);
  });
});
