import { seoulClock, seoulDate, seoulWeekday } from './seoul-date';

describe('seoul-date', () => {
  it('UTC 자정 직전이면 서울은 이미 다음 날이다', () => {
    const at = new Date('2026-08-27T23:30:00Z');

    expect(seoulDate(at)).toBe('2026-08-28');
  });

  it('서울 자정 직전을 주면 그 날짜와 시각을 그대로 돌려준다', () => {
    const at = new Date('2026-08-27T23:59:00+09:00');

    expect(seoulClock(at)).toEqual({
      date: '2026-08-27',
      hour: 23,
      minute: 59,
    });
  });

  it('요일도 서울 기준으로 센다 — 기기 시간대가 달라도 같은 요일이다', () => {
    const at = new Date('2026-08-27T20:00:00Z');

    expect(seoulWeekday(at)).toBe(5);
  });
});
