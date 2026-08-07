// 캘린더 창 이동 검증 — 경계(달 넘김·앞뒤 한계)가 계약이다
import { describe, expect, it } from 'vitest';

import {
  canGoBack,
  canGoForward,
  firstDayOfWindow,
  shiftWindow,
} from './calendar-window';

describe('firstDayOfWindow', () => {
  it('같은 주의 날짜들은 한 날로 모인다', () => {
    // Given 같은 주에 속한 서로 다른 날에서
    // When 창의 첫날을 구하면
    // Then 같은 일요일이 나온다 — 조회를 한 번만 하게 하는 근거다
    expect(firstDayOfWindow('2026-08-03', 'WEEK')).toBe('2026-08-02');
    expect(firstDayOfWindow('2026-08-05', 'WEEK')).toBe('2026-08-02');
  });

  it('같은 달의 날짜들은 1일로 모인다', () => {
    expect(firstDayOfWindow('2026-08-31', 'MONTH')).toBe('2026-08-01');
  });
});

describe('shiftWindow', () => {
  it('주는 7일씩 옮긴다', () => {
    expect(shiftWindow('2026-08-02', 'WEEK', -1)).toBe('2026-07-26');
    expect(shiftWindow('2026-07-26', 'WEEK', 1)).toBe('2026-08-02');
  });

  it('달은 그 달 1일로 옮긴다 — 말일이 없는 달로 넘어가도 달을 건너뛰지 않는다', () => {
    // Given 31일에 서 있는 상태에서
    // When 다음 달로 옮기면
    // Then 30일까지뿐인 달로 가도 그 달 안에 머문다
    expect(shiftWindow('2026-08-31', 'MONTH', 1)).toBe('2026-09-01');
    expect(shiftWindow('2026-03-31', 'MONTH', -1)).toBe('2026-02-01');
  });
});

describe('canGoForward', () => {
  it('오늘이 든 창에서는 앞으로 못 간다', () => {
    // Given 오늘이 든 주를 보고 있을 때
    // When 다음 주로 갈 수 있는지 물으면
    // Then 미래는 조회할 게 없어 막힌다
    expect(canGoForward('2026-08-02', 'WEEK', '2026-08-02')).toBe(false);
  });

  it('지난 창에서는 앞으로 갈 수 있다', () => {
    expect(canGoForward('2026-07-20', 'WEEK', '2026-08-02')).toBe(true);
  });
});

describe('canGoBack', () => {
  it('시작일이 든 창보다 앞으로는 못 간다', () => {
    // Given 첫 완료일이 그 주에 있는 창에서
    // When 이전 주로 갈 수 있는지 물으면
    // Then 그 앞은 볼 것이 없어 막힌다
    expect(canGoBack('2026-07-27', 'WEEK', '2026-07-28')).toBe(false);
  });

  it('완료 이력이 아예 없으면 뒤로 갈 곳이 없다', () => {
    // 신규 사용자는 startedAt이 null이다 — 볼 완료 기록이 없으니 뒤로 갈 이유도 없다
    expect(canGoBack('2026-08-02', 'WEEK', null)).toBe(false);
  });
});
