// 주간 스트립 검증 — 오늘(서울 기준)로 끝나는 7칸의 요일 라벨이 실제 날짜와 맞아야 한다
import { buildWeekStrip } from './week-strip';

const kst = (date: string, time: string) =>
  new Date(`${date}T${time}:00+09:00`);

const WEEKLY = [true, true, false, true, true, true, false];

describe('buildWeekStrip', () => {
  it('오늘이 수요일이면 목~수 순서의 라벨을 만든다', () => {
    const { labels } = buildWeekStrip({
      weeklyDone: WEEKLY,
      now: kst('2026-08-26', '21:00'), // 수요일
    });

    expect(labels).toEqual(['목', '금', '토', '일', '월', '화', '수']);
  });

  it('오늘이 일요일이면 월~일 순서의 라벨을 만든다', () => {
    const { labels } = buildWeekStrip({
      weeklyDone: WEEKLY,
      now: kst('2026-08-30', '10:00'), // 일요일
    });

    expect(labels).toEqual(['월', '화', '수', '목', '금', '토', '일']);
  });

  it('요일 판정은 기기 시각이 아니라 서울 기준이다 — UTC 자정 직전에도 서울 날짜를 따른다', () => {
    // UTC 2026-08-25 23:00 = 서울 2026-08-26 08:00 (수요일)
    const { labels } = buildWeekStrip({
      weeklyDone: WEEKLY,
      now: new Date('2026-08-25T23:00:00Z'),
    });

    expect(labels[6]).toBe('수');
  });

  it('완료 배열은 스냅샷 순서 그대로 돌려준다', () => {
    const { done } = buildWeekStrip({
      weeklyDone: WEEKLY,
      now: kst('2026-08-26', '21:00'),
    });

    expect(done).toEqual(WEEKLY);
  });
});
