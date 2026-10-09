// 알람 시각 — 서버 "HH:mm"을 시·분으로 읽고, 다시 서버 형식과 화면 글자로 바꾼다
import { describe, expect, it } from 'vitest';

import {
  formatAlarmTime,
  formatClock,
  parseAlarmTime,
  toServerTime,
} from './alarm-time';

describe('parseAlarmTime', () => {
  it('서버 시각을 시·분으로 바꾼다', () => {
    expect(parseAlarmTime('07:30')).toEqual({ hour: 7, minute: 30 });
  });

  it('미설정(null)이면 기본 시각 오후 7시를 쓴다', () => {
    expect(parseAlarmTime(null)).toEqual({ hour: 19, minute: 0 });
  });

  it('형식이 깨진 값도 기본 시각으로 물러선다', () => {
    expect(parseAlarmTime('25:99')).toEqual({ hour: 19, minute: 0 });
  });
});

describe('toServerTime', () => {
  it('한 자리 시·분은 0을 채워 "HH:mm"으로 만든다', () => {
    expect(toServerTime({ hour: 7, minute: 5 })).toBe('07:05');
  });
});

describe('formatAlarmTime', () => {
  it.each([
    ['정각이면 분을 뺀다', 19, 0, '오후 7시'],
    ['분이 있으면 붙인다', 19, 25, '오후 7시 25분'],
    ['오전 시각', 7, 30, '오전 7시 30분'],
    ['자정은 오전 12시', 0, 0, '오전 12시'],
    ['정오는 오후 12시', 12, 0, '오후 12시'],
  ])('%s', (_, hour, minute, expected) => {
    expect(formatAlarmTime({ hour, minute })).toBe(expected);
  });
});

describe('formatClock', () => {
  it('휠과 같은 모양 "오후 7:05"로 쓴다', () => {
    expect(formatClock({ hour: 19, minute: 5 })).toBe('오후 7:05');
  });

  it('자정은 "오전 12:00"이다', () => {
    expect(formatClock({ hour: 0, minute: 0 })).toBe('오전 12:00');
  });
});
