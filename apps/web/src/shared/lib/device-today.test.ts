// 기기의 오늘 — 기기 현지 날짜를 YYYY-MM-DD로 적는다
import { describe, expect, it } from 'vitest';

import { getDeviceToday } from './device-today';

describe('getDeviceToday', () => {
  it('한 자리 월·일을 두 자리로 채운다', () => {
    expect(getDeviceToday(new Date(2026, 9, 7, 0, 5))).toBe('2026-10-07');
  });
});
