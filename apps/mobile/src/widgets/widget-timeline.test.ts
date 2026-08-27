// 위젯 타임라인 계획 검증 — 예약 엔트리의 시각 경계와 상태 전환을 고정한다
import { buildWidgetTimeline } from './widget-timeline';

const kst = (date: string, time: string) =>
  new Date(`${date}T${time}:00+09:00`);

const ARRIVED_POOL = ['arrived', 'carpet'];

const dataOf = (
  over: Partial<Parameters<typeof buildWidgetTimeline>[0]['data']> = {},
) => ({
  streak: 5,
  todayDone: false,
  lastCompletedDate: '2026-08-24',
  todayCardTitle: '룸메이트와 첫인사',
  weeklyDone: [true, true, false, true, true, true, false],
  ...over,
});

describe('buildWidgetTimeline', () => {
  it('첫 엔트리는 지금 시각과 지금의 상태다', () => {
    const now = kst('2026-08-25', '15:00');
    const [first] = buildWidgetTimeline({ data: dataOf(), now });

    expect(first.date).toEqual(now);
    expect(first.state.kind).toBe('nudge');
  });

  it('오늘 남은 시간표 경계들이 순서대로 예약된다', () => {
    const plans = buildWidgetTimeline({
      data: dataOf(),
      now: kst('2026-08-25', '15:00'),
    });

    const todayPlans = plans.filter((p) => p.date < kst('2026-08-26', '00:00'));
    expect(todayPlans.map((p) => [p.date.toISOString(), p.state.kind])).toEqual(
      [
        [kst('2026-08-25', '15:00').toISOString(), 'nudge'],
        [kst('2026-08-25', '18:00').toISOString(), 'ask'],
        [kst('2026-08-25', '19:00').toISOString(), 'wait'],
        [kst('2026-08-25', '20:00').toISOString(), 'risk'],
        [kst('2026-08-25', '21:00').toISOString(), 'melted'],
        [kst('2026-08-25', '23:00').toISOString(), 'last'],
        [kst('2026-08-25', '23:30').toISOString(), 'plead'],
      ],
    );
  });

  it('오늘 완료한 상태는 자정 엔트리에서 카드 도착으로 넘어간다', () => {
    const plans = buildWidgetTimeline({
      data: dataOf({ lastCompletedDate: '2026-08-25', todayDone: true }),
      now: kst('2026-08-25', '21:00'),
    });

    const midnight = plans.find(
      (p) => p.date.getTime() === kst('2026-08-26', '00:00').getTime(),
    );
    expect(midnight).toBeDefined();
    expect(ARRIVED_POOL).toContain(midnight?.state.kind);
  });

  it('지나간 경계는 예약하지 않고 시각은 항상 오름차순이다', () => {
    const now = kst('2026-08-25', '20:10');
    const plans = buildWidgetTimeline({ data: dataOf(), now });

    expect(plans[0].date).toEqual(now);
    for (let i = 1; i < plans.length; i += 1) {
      expect(plans[i].date.getTime()).toBeGreaterThan(
        plans[i - 1].date.getTime(),
      );
    }
  });

  it('오늘 포함 3일치 경계까지만 예약한다 — 그 뒤는 앱이 다시 열릴 때 갱신한다', () => {
    const now = kst('2026-08-25', '15:00');
    const plans = buildWidgetTimeline({ data: dataOf(), now });

    const last = plans[plans.length - 1];
    expect(last.date).toEqual(kst('2026-08-27', '23:30'));
  });

  it('내일 아무것도 안 하면 모레 자정 엔트리부터 몰락 상태가 예약된다', () => {
    // 오늘(25일) 완료 → 26일을 통째로 거르면 27일 자정부터 끊김
    const plans = buildWidgetTimeline({
      data: dataOf({ lastCompletedDate: '2026-08-25' }),
      now: kst('2026-08-25', '21:00'),
    });

    const dayAfterMidnight = plans.find(
      (p) => p.date.getTime() === kst('2026-08-27', '00:00').getTime(),
    );
    expect(dayAfterMidnight?.state.kind).toBe('hungry');

    const dayAfterNoon = plans.find(
      (p) => p.date.getTime() === kst('2026-08-27', '12:00').getTime(),
    );
    expect(dayAfterNoon?.state.kind).toBe('burnt');
  });
});
