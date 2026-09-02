// 위젯 상태 결정 로직 검증 — 스펙의 우선순위 사다리(완료 → 끊김 → 시간표)와 모든 시각 경계를 고정한다
import { decideWidgetState } from './widget-state';

// Asia/Seoul 시각을 만든다 — 위젯 판정은 전부 서울 기준
const kst = (date: string, time: string) =>
  new Date(`${date}T${time}:00+09:00`);

// 배리에이션 풀 — 날짜 시드로 이 중 하나가 그날의 화면이 된다
const DONE_POOL = ['done', 'love', 'scored'];
const ARRIVED_POOL = ['arrived', 'carpet'];

const dataOf = (
  over: Partial<Parameters<typeof decideWidgetState>[0]['data']> = {},
) => ({
  streak: 5,
  todayDone: false,
  lastCompletedDate: '2026-08-24',
  todayCardTitle: '룸메이트와 첫인사',
  weeklyDone: [true, true, false, true, true, true, false],
  capturedOn: '2026-08-25',
  ...over,
});

const decide = (now: Date, over: Parameters<typeof dataOf>[0] = {}) =>
  decideWidgetState({ data: dataOf(over), now });

describe('decideWidgetState — 시작 전', () => {
  it('완료 이력도 오늘 카드도 없으면 시작 안내를 보여준다 — 로그인 전이 이 경우다', () => {
    const state = decide(kst('2026-08-25', '15:00'), {
      streak: 0,
      lastCompletedDate: null,
      todayCardTitle: null,
    });

    expect(state.kind).toBe('welcome');
    expect(state.displayStreak).toBe(0);
  });

  it('오늘 카드가 있으면 아직 한 번도 완료 안 했어도 시간표를 탄다 — 로그인한 신규 사용자다', () => {
    const state = decide(kst('2026-08-25', '15:00'), {
      streak: 0,
      lastCompletedDate: null,
      todayCardTitle: '룸메이트와 첫인사',
    });

    expect(state.kind).toBe('nudge');
  });
});

describe('decideWidgetState — 우선순위', () => {
  it('오늘 완료했으면 밤 급박 시각이어도 완료 상태를 보여준다', () => {
    const state = decide(kst('2026-08-25', '23:30'), {
      lastCompletedDate: '2026-08-25',
    });

    expect(DONE_POOL).toContain(state.kind);
  });

  it('판정은 todayDone이 아니라 마지막 완료 날짜로 한다 — 낡은 위젯 데이터도 자정이 지나면 시간표로 돌아온다', () => {
    // 어제 완료 직후 저장된 위젯 데이터(todayDone: true)를 오늘 아침에 읽는 상황
    const state = decide(kst('2026-08-25', '09:00'), {
      todayDone: true,
      lastCompletedDate: '2026-08-24',
    });

    expect(ARRIVED_POOL).toContain(state.kind);
  });
});

describe('decideWidgetState — 완료한 날', () => {
  const today = { lastCompletedDate: '2026-08-25' };

  it('완료 화면은 랜덤 풀(완료·하트·열매획득)에서 그날의 그림을 고른다', () => {
    const state = decide(kst('2026-08-25', '21:00'), today);

    expect(DONE_POOL).toContain(state.kind);
  });

  it('랜덤 풀은 날짜 시드라 같은 날에는 항상 같은 화면이 나온다', () => {
    const first = decide(kst('2026-08-25', '15:00'), today);
    const second = decide(kst('2026-08-25', '22:00'), today);

    expect(first.kind).toBe(second.kind);
  });

  it.each([[7], [14], [20], [30]])(
    '완료한 날 스트릭이 %i이면 랜덤 풀 대신 마일스톤을 보여준다',
    (milestone) => {
      const state = decide(kst('2026-08-25', '20:10'), {
        ...today,
        streak: milestone,
      });

      expect(state.kind).toBe('milestone');
      expect(state.milestone).toBe(milestone);
    },
  );

  it('완료 상태의 숫자는 현재 스트릭이다', () => {
    const state = decide(kst('2026-08-25', '15:00'), { ...today, streak: 6 });

    expect(state.displayStreak).toBe(6);
  });
});

describe('decideWidgetState — 미완료 하루 시간표 (어제까지 완료)', () => {
  it('00~12시 카드 도착 슬롯은 배리에이션 풀에서 그날의 그림을 고른다 — 하루 안에서는 고정', () => {
    const first = decide(kst('2026-08-25', '00:00'));
    const second = decide(kst('2026-08-25', '11:59'));

    expect(ARRIVED_POOL).toContain(first.kind);
    expect(first.kind).toBe(second.kind);
  });

  it.each([
    ['12:00', 'nudge'],
    ['17:59', 'nudge'],
    ['18:00', 'ask'],
    ['18:59', 'ask'],
    ['19:00', 'wait'],
    ['19:59', 'wait'],
    ['20:00', 'risk'],
    ['20:59', 'risk'],
    ['21:00', 'melted'],
    ['22:59', 'melted'],
    ['23:00', 'last'],
    ['23:29', 'last'],
    ['23:30', 'plead'],
    ['23:59', 'plead'],
  ] as const)('%s에는 %s를 보여준다', (time, kind) => {
    const state = decide(kst('2026-08-25', time));

    expect(state.kind).toBe(kind);
    // 스트릭은 아직 살아있으므로 그대로 보여준다
    expect(state.displayStreak).toBe(5);
  });

  it('완료 이력이 없는 신규 유저도 시간표를 따른다 — 몰락 연출을 하지 않는다', () => {
    const state = decide(kst('2026-08-25', '14:00'), {
      streak: 0,
      lastCompletedDate: null,
    });

    expect(state.kind).toBe('nudge');
    expect(state.displayStreak).toBe(0);
  });
});

describe('decideWidgetState — 끊긴 뒤 (날짜 단위 몰락)', () => {
  // 마지막 완료 = 08-23. 08-24를 통째로 걸렀으므로 08-25 자정부터 끊김
  const broken = { lastCompletedDate: '2026-08-23' };

  it('끊긴 날 자정~오전에는 배고픔(④-b)을 보여준다', () => {
    const state = decide(kst('2026-08-25', '09:00'), broken);

    expect(state.kind).toBe('hungry');
  });

  it('끊긴 날 낮부터는 타버림(⑨)을 보여주고 직전 스트릭을 그대로 보여준다', () => {
    const state = decide(kst('2026-08-25', '12:00'), broken);

    expect(state.kind).toBe('burnt');
    expect(state.displayStreak).toBe(5);
  });

  it.each([
    ['2026-08-22', 'bone'], // 3일째
    ['2026-08-19', 'bone'], // 6일째
    ['2026-08-18', 'cracked'], // 7일째
    ['2026-07-27', 'cracked'], // 29일째
    ['2026-07-26', 'gone'], // 30일째
  ] as const)(
    '마지막 완료가 %s이면 %s를 보여준다',
    (lastCompletedDate, kind) => {
      const state = decide(kst('2026-08-25', '14:00'), { lastCompletedDate });

      expect(state.kind).toBe(kind);
      // 해골부터는 숫자가 0으로 떨어진다
      expect(state.displayStreak).toBe(0);
    },
  );
});
