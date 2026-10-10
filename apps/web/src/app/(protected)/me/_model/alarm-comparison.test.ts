// 서버 알람 설정과 이 폰에 걸린 매일 알람의 어긋남을 사람 말로 옮긴다
import { describe, expect, it } from 'vitest';

import { compareWithServer } from './alarm-comparison';

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

describe('compareWithServer — 서버 설정과 이 폰에 걸린 매일 알람', () => {
  const phone = (hour: number, minute: number) => ({
    repeatingAlarms: [
      {
        alarmType: 'scenario' as const,
        schedules: [{ hour, minute, weekdays: EVERY_DAY }],
        path: '/scenario',
        skipDate: null,
      },
    ],
  });
  const NOTHING = { repeatingAlarms: [] };

  it('시각이 같으면 맞는다', () => {
    expect(
      compareWithServer({ time: '01:32', enabled: true }, phone(1, 32)),
    ).toEqual({
      server: '매일 오전 1:32',
      phone: '매일 오전 1:32',
      differs: false,
    });
  });

  it('시각이 다르면 어긋났다 — 다른 폰에서 바꾸고 이 폰 앱을 안 연 경우', () => {
    expect(
      compareWithServer({ time: '01:32', enabled: true }, phone(11, 50)),
    ).toEqual({
      server: '매일 오전 1:32',
      phone: '매일 오전 11:50',
      differs: true,
    });
  });

  it('서버는 켰는데 폰에 없으면 어긋났다', () => {
    expect(
      compareWithServer({ time: '19:00', enabled: true }, NOTHING),
    ).toEqual({
      server: '매일 오후 7:00',
      phone: '없음',
      differs: true,
    });
  });

  it('서버가 꺼져 있고 폰에도 없으면 맞는다', () => {
    expect(
      compareWithServer({ time: '19:00', enabled: false }, NOTHING),
    ).toEqual({
      server: '꺼짐',
      phone: '없음',
      differs: false,
    });
  });

  it('서버 설정을 아직 모르면 어긋났다고 하지 않는다', () => {
    expect(compareWithServer(undefined, phone(11, 50))).toEqual({
      server: '불러오는 중',
      phone: '매일 오전 11:50',
      differs: false,
    });
  });
});
