// 위젯 타임라인 계획 검증 — 예약 엔트리의 시각 경계와 상태 전환을 고정한다
import { buildWidgetTimeline } from './timeline';

const kst = (date: string, time: string) =>
  new Date(`${date}T${time}:00+09:00`);

const ARRIVED_POOL = ['arrived', 'carpet'];

const dataOf = (
  over: Partial<Parameters<typeof buildWidgetTimeline>[0]['data']> = {},
) => ({
  streak: 5,
  todayDone: false,
  lastCompletedDate: '2026-08-24',
  weeklyDone: [true, true, false, true, true, true, false],
  capturedOn: '2026-08-25',
  ...over,
});

describe('buildWidgetTimeline', () => {
  it('타임라인을 만들면 첫 엔트리가 지금 시각과 지금 상태다', () => {
    const now = kst('2026-08-25', '15:00');
    const [first] = buildWidgetTimeline({ data: dataOf(), now });

    expect(first.date).toEqual(now);
    expect(first.state.kind).toBe('nudge');
  });

  it('낮에 만들면 오늘 남은 시간표 경계를 순서대로 예약한다', () => {
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

  it('오늘 완료한 뒤 만들면 자정 엔트리에서 카드 도착으로 넘어간다', () => {
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

  it('경계를 지난 시각에 만들면 지나간 경계를 빼고 오름차순으로 준다', () => {
    const now = kst('2026-08-25', '20:10');
    const plans = buildWidgetTimeline({ data: dataOf(), now });

    expect(plans[0].date).toEqual(now);
    for (let i = 1; i < plans.length; i += 1) {
      expect(plans[i].date.getTime()).toBeGreaterThan(
        plans[i - 1].date.getTime(),
      );
    }
  });

  it('한 번 예약하면 완료 30일 뒤 소등까지 흘러간다 — 앱을 안 열어도 몰락이 진행된다', () => {
    const plans = buildWidgetTimeline({
      data: dataOf({ lastCompletedDate: '2026-08-25' }),
      now: kst('2026-08-25', '21:00'),
    });

    const gone = plans.find((p) => p.state.kind === 'gone');
    expect(gone?.date).toEqual(kst('2026-09-24', '00:00'));
  });

  it('같은 날 안에서 화면이 같으면 예약하지 않는다 — 몰락 구간은 시각 경계가 전부 접힌다', () => {
    const plans = buildWidgetTimeline({
      data: dataOf({ lastCompletedDate: '2026-08-25' }),
      now: kst('2026-08-25', '21:00'),
    });

    for (let i = 1; i < plans.length; i += 1) {
      // 서울 기준으로 비교한다 — toISOString은 UTC라 서울의 자정~아침이 전날로 묶인다
      const seoulDay = (d: Date) =>
        new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const sameDay = seoulDay(plans[i].date) === seoulDay(plans[i - 1].date);
      if (sameDay) expect(plans[i].state).not.toEqual(plans[i - 1].state);
    }
    // 하루 8경계 × 31일이 날짜당 한두 개로 줄어든다
    expect(plans.length).toBeLessThan(50);
  });

  it('화면이 같아도 날이 바뀌면 자정 엔트리는 남긴다 — 주간 스트립 창을 그날로 밀어야 한다', () => {
    // 해골 구간(3~6일째)은 화면이 며칠째 같지만, 날마다 스트립이 하루씩 밀린다
    const plans = buildWidgetTimeline({
      data: dataOf({ lastCompletedDate: '2026-08-25' }),
      now: kst('2026-08-25', '21:00'),
    });

    // 기기 로컬이 아니라 서울 기준 자정이어야 한다 — CI는 UTC로 돈다
    const seoulMidnight = (d: Date) =>
      (d.getTime() + 9 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000) === 0;
    const boneMidnights = plans.filter(
      (p) => p.state.kind === 'bone' && seoulMidnight(p.date),
    );
    expect(boneMidnights.length).toBeGreaterThanOrEqual(3);
  });

  it('내일 아무것도 안 하면 모레 자정 엔트리부터 몰락 상태를 예약한다', () => {
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
