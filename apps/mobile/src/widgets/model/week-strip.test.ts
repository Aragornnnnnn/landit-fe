// 주간 스트립 검증 — 오늘(서울 기준)로 끝나는 7칸의 요일 라벨이 실제 날짜와 맞아야 한다
import { buildWeekStrip } from './week-strip';

const kst = (date: string, time: string) =>
  new Date(`${date}T${time}:00+09:00`);

const WEEKLY = [true, true, false, true, true, true, false];

describe('buildWeekStrip', () => {
  it('오늘이 수요일이면 목~수 순서의 라벨을 만든다', () => {
    const { labels } = buildWeekStrip({
      weeklyDone: WEEKLY,
      capturedOn: '2026-08-26',
      now: kst('2026-08-26', '21:00'), // 수요일
    });

    expect(labels).toEqual(['목', '금', '토', '일', '월', '화', '수']);
  });

  it('오늘이 일요일이면 월~일 순서의 라벨을 만든다', () => {
    const { labels } = buildWeekStrip({
      weeklyDone: WEEKLY,
      capturedOn: '2026-08-30',
      now: kst('2026-08-30', '10:00'), // 일요일
    });

    expect(labels).toEqual(['월', '화', '수', '목', '금', '토', '일']);
  });

  it('UTC 자정 직전에 만들면 기기 시각이 아니라 서울 날짜로 요일을 붙인다', () => {
    // UTC 2026-08-25 23:00 = 서울 2026-08-26 08:00 (수요일)
    const { labels } = buildWeekStrip({
      weeklyDone: WEEKLY,
      capturedOn: '2026-08-26',
      now: new Date('2026-08-25T23:00:00Z'),
    });

    expect(labels[6]).toBe('수');
  });

  it('기준일과 같은 날 그리면 완료 배열을 그대로 돌려준다', () => {
    const { done } = buildWeekStrip({
      weeklyDone: WEEKLY,
      capturedOn: '2026-08-26',
      now: kst('2026-08-26', '21:00'),
    });

    expect(done).toEqual(WEEKLY);
  });

  it('기준일보다 이틀 지나 그리면 창을 오늘까지 민다 — 앱을 안 연 날은 완료했을 리 없어 미완료로 확정', () => {
    const { labels, done } = buildWeekStrip({
      weeklyDone: WEEKLY, // 목(8/20)~수(8/26)의 기록
      capturedOn: '2026-08-26',
      now: kst('2026-08-28', '09:00'), // 금요일
    });

    expect(labels).toEqual(['토', '일', '월', '화', '수', '목', '금']);
    // 앞의 이틀(목·금)은 창 밖으로 나가고, 안 연 이틀(새 목·금)은 미완료
    expect(done).toEqual([false, true, true, true, false, false, false]);
  });

  it('기준일이 없으면(로그인 전) 전부 미완료로 그린다', () => {
    const { done } = buildWeekStrip({
      weeklyDone: WEEKLY,
      capturedOn: null,
      now: kst('2026-08-26', '21:00'),
    });

    expect(done).toEqual([false, false, false, false, false, false, false]);
  });

  it('기준일에서 일주일 넘게 지나면 전부 미완료다 — 옛 기록이 새 창에 남지 않는다', () => {
    const { done } = buildWeekStrip({
      weeklyDone: WEEKLY,
      capturedOn: '2026-08-26',
      now: kst('2026-09-10', '09:00'),
    });

    expect(done).toEqual([false, false, false, false, false, false, false]);
  });
});
