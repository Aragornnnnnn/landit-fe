// 알람 시각 — 서버 "HH:mm"을 시·분으로 읽는다
import { describe, expect, it } from 'vitest';

import { parseAlarmTime } from './alarm-time';

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
