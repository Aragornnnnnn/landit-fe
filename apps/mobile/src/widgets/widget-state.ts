// 위젯 상태 결정 — 위젯 데이터와 현재 시각으로 어떤 래디를 보여줄지 정한다. 양 플랫폼(Android JS·iOS Swift)의 공통 정답지
import type { WidgetData } from '@landit/bridge';

// 시안 상태 키 — 피그마 카드 이름(Widget/Small · {kind})과 1:1
export type WidgetStateKind =
  | 'welcome' // ⓪ 시작 전 — 로그인 전이거나 아직 받은 카드가 없다
  | 'arrived' // ① 카드 도착
  | 'carpet' // 카드 도착 배리에이션 — 양탄자 배송 (뱁새)
  | 'nudge' // ② 가벼운 재촉
  | 'ask' // ③ 의아함
  | 'wait' // ④ 램프 속 대기
  | 'risk' // ⑤ 매달림
  | 'melted' // ⑤-b 녹는 중
  | 'last' // ⑥ 마지막 경고
  | 'plead' // ⑤-c 애원
  | 'done' // ⑦ 완료
  | 'scored' // ⑦-b 열매 획득
  | 'love' // ⑦-c 하트뿅뿅
  | 'hungry' // ④-b 배고픔
  | 'burnt' // ⑨ 다 타버렸어요
  | 'bone' // ⑩ 스트릭 0
  | 'cracked' // ⑪-b 램프 파손
  | 'gone' // ⑫ 완전 이탈
  | 'milestone'; // 열매 파티 (7·14·20·30)

export interface WidgetState {
  kind: WidgetStateKind;
  // 화면에 그릴 숫자 — data.streak과 다를 수 있다. 끊긴 날(⑨·④-b)까지는 직전 스트릭, 해골(⑩)부터 0
  displayStreak: number;
  // kind가 milestone일 때만 값이 있다
  milestone: (typeof MILESTONES)[number] | null;
}

export const MILESTONES = [7, 14, 20, 30] as const;

// 배리에이션 풀은 "볼 때마다"가 아니라 날짜 시드 — 그날 하루는 같은 화면. ⑦-d는 에셋 교체 전까지 제외.
// 수레·낮잠 아트는 마일스톤(14·20) 전용으로 확정 — 완료 풀에는 넣지 않는다
const DONE_POOL: WidgetStateKind[] = ['done', 'love', 'scored'];
const ARRIVED_POOL: WidgetStateKind[] = ['arrived', 'carpet'];

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

// 기기 타임존과 무관하게 서울 기준 날짜·시각으로 판정한다
const seoulClock = (now: Date) => {
  const seoulTime = new Date(now.getTime() + SEOUL_OFFSET_MS);
  return {
    date: seoulTime.toISOString().slice(0, 10),
    hour: seoulTime.getUTCHours(),
    minute: seoulTime.getUTCMinutes(),
  };
};

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      (24 * 60 * 60 * 1000),
  );

export const decideWidgetState = ({
  data,
  now,
}: {
  data: WidgetData;
  now: Date;
}): WidgetState => {
  const clock = seoulClock(now);
  // 완료 이력도 오늘 카드도 없다 = 아직 시작 전이다. 로그인 전에는 웹이 빈 값을 보내 여기 걸린다.
  // 이 사람에게 시간표로 재촉해봐야 누를 카드가 없다
  if (data.lastCompletedDate === null && data.todayCardTitle === null) {
    return { kind: 'welcome', displayStreak: 0, milestone: null };
  }
  // todayDone은 저장 당시의 오늘일 뿐이라 믿지 않는다 — 낡은 데이터도 날짜 차이로는 항상 옳다
  const daysSinceLastDone =
    data.lastCompletedDate === null
      ? null
      : daysBetween(data.lastCompletedDate, clock.date);

  // 오늘 이미 완료
  if (daysSinceLastDone === 0) return completedState(data, clock.date);
  // 하루를 통째로 걸렀다 — 1은 어제 완료(스트릭 유지)라 아직 끊긴 게 아니다
  if (daysSinceLastDone !== null && daysSinceLastDone >= 2) {
    return decayState(data, daysSinceLastDone, clock);
  }
  // 어제까지 완료(스트릭 유지) 또는 완료 이력 없는 신규 유저 — 하루 시간표
  const kind = timetableKind(clock);
  return {
    // 카드 도착 슬롯은 배리에이션 풀 — 날짜 시드로 그날의 그림이 정해진다
    kind:
      kind === 'arrived' ? pickDailyVariation(clock.date, ARRIVED_POOL) : kind,
    displayStreak: data.streak,
    milestone: null,
  };
};

// 오늘 완료한 날의 화면 — 마일스톤 달성일이면 축하, 아니면 완료 풀에서 그날의 그림
const completedState = (data: WidgetData, today: string): WidgetState => {
  const milestone = MILESTONES.includes(
    data.streak as (typeof MILESTONES)[number],
  )
    ? (data.streak as (typeof MILESTONES)[number])
    : null;
  if (milestone !== null) {
    return { kind: 'milestone', displayStreak: data.streak, milestone };
  }
  return {
    kind: pickDailyVariation(today, DONE_POOL),
    displayStreak: data.streak,
    milestone: null,
  };
};

// 같은 날에는 같은 그림을 고른다 — 날짜 시드라 위젯이 다시 그려져도 깜빡이지 않는다
const pickDailyVariation = (
  date: string,
  pool: WidgetStateKind[],
): WidgetStateKind => {
  let hash = 0;
  for (const char of date) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return pool[hash % pool.length];
};

// 스트릭이 끊긴 뒤의 화면 — 경과 일수에 따라 배고픔 → 타버림 → 해골 → 균열 → 소등
const decayState = (
  data: WidgetData,
  daysSinceLastDone: number,
  clock: { hour: number },
): WidgetState => {
  // 끊긴 날: 자정~오전 배고픔 → 낮부터 타버림. 직전 스트릭을 그대로 보여줘 잃은 것을 체감시킨다
  if (daysSinceLastDone === 2) {
    return {
      kind: clock.hour < 12 ? 'hungry' : 'burnt',
      displayStreak: data.streak,
      milestone: null,
    };
  }
  const kind =
    daysSinceLastDone < 7
      ? 'bone'
      : daysSinceLastDone < 30
        ? 'cracked'
        : 'gone';
  return { kind, displayStreak: 0, milestone: null };
};

// 아직 완료 전인 하루의 화면 — 시각이 늦어질수록 재촉이 세진다
const timetableKind = (clock: {
  hour: number;
  minute: number;
}): WidgetStateKind => {
  const { hour, minute } = clock;
  if (hour < 12) return 'arrived';
  if (hour < 18) return 'nudge';
  // 저녁 6시부터 1시간 단위로 어두워지고, 마지막 경고는 자정 1시간 전(시안 의도), 애원은 마지막 30분 스퍼트
  if (hour < 19) return 'ask';
  if (hour < 20) return 'wait';
  if (hour < 21) return 'risk';
  if (hour < 23) return 'melted';
  if (minute < 30) return 'last';
  return 'plead';
};
