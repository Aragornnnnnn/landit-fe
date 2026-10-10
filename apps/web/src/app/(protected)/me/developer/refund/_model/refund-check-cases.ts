// 환급 점검 케이스 — 서버 없이 화면을 열 가짜 환급 응답과 내역을 만든다
import type {
  RewardActivity,
  RewardHistoryItem,
  RewardToday,
  RewardView,
} from '@/features/reward/api/reward';
import {
  endedRewardView,
  rewardActivity,
  rewardCycle,
  rewardToday,
  rewardView,
} from '@/features/reward/model/reward.fixture';

// 가짜 내역이 서버를 흉내 내는 방식 — 이어 받기(많아야 세 장) / 둘째 장에서 한 번 실패 / 한 줄도 없음
export type HistoryMode = 'pages' | 'failOnce' | 'empty';

export interface RecordCase {
  reward: RewardView;
  history: HistoryMode;
}

const activity = (
  activityType: RewardActivity['activityType'],
  completedCount: number,
  earnedWon: number,
  remainingWon: number,
) =>
  rewardActivity(activityType, {
    earnedWon,
    completedCount,
    completed: remainingWon === 0,
    remainingWon,
  });

const NOT_YET = [
  activity('SCENARIO', 0, 0, 111),
  activity('EXPRESSION', 0, 0, 110),
  activity('SMALLTALK', 0, 0, 111),
];
const PARTLY = [
  activity('SCENARIO', 1, 111, 0),
  activity('EXPRESSION', 2, 22, 88),
  activity('SMALLTALK', 0, 0, 111),
];
const ALL_DONE = [
  activity('SCENARIO', 1, 111, 0),
  activity('EXPRESSION', 4, 110, 0),
  activity('SMALLTALK', 1, 111, 0),
];

const active = (
  balanceWon: number,
  today: Partial<RewardToday>,
  patch: Partial<RewardView> = {},
) =>
  rewardView({
    current: rewardCycle({ balanceWon }),
    today: rewardToday(today),
    ...patch,
  });

export const RECORD_CASES = {
  yet: { reward: active(1882, { activities: NOT_YET }), history: 'pages' },
  partly: {
    reward: active(2015, { earnedWon: 133, activities: PARTLY }),
    history: 'pages',
  },
  full: {
    reward: active(2214, {
      earnedWon: 332,
      fullyAchieved: true,
      activities: ALL_DONE,
    }),
    history: 'pages',
  },
  reset: {
    reward: active(0, { activities: NOT_YET }, { lostYesterdayWon: 1550 }),
    history: 'pages',
  },
  ended: { reward: endedRewardView(31920), history: 'pages' },
  review: {
    reward: rewardView({
      state: 'REVIEW',
      current: rewardCycle({ balanceWon: 1882 }),
      today: null,
      remainingDays: null,
    }),
    history: 'pages',
  },
  'history-fail': {
    reward: active(2015, { earnedWon: 133, activities: PARTLY }),
    history: 'failOnce',
  },
  'history-empty': {
    reward: active(0, { activities: NOT_YET }),
    history: 'empty',
  },
} satisfies Record<string, RecordCase>;

// 열 수 있는 케이스 — 환급 화면 케이스에 소개·불러오는 중·받는 순간을 더한 것
const OTHER_CASES = ['intro', 'loading', 'coin', 'pop'] as const;
type RecordCaseName = keyof typeof RECORD_CASES;
export type CheckCase = RecordCaseName | (typeof OTHER_CASES)[number];

export const isRecordCase = (name: CheckCase): name is RecordCaseName =>
  Object.hasOwn(RECORD_CASES, name);

// 주소에 실려 온 케이스. 없거나 모르는 값이면 null — 그때는 목록을 보여 준다
export const readCheckCase = (raw: string | null): CheckCase | null =>
  [...Object.keys(RECORD_CASES), ...OTHER_CASES].find(
    (name): name is CheckCase => name === raw,
  ) ?? null;

// 하루를 다 채웠을 때 쌓이는 여섯 줄을 늦은 것부터 — [무엇을, 금액, 시각]
const FULL_DAY_LATEST_FIRST = [
  ['SMALLTALK', 111, '21:40'],
  ['EXPRESSION', 77, '08:31'],
  ['EXPRESSION', 11, '08:27'],
  ['EXPRESSION', 11, '08:24'],
  ['EXPRESSION', 11, '08:21'],
  ['SCENARIO', 111, '08:12'],
] as const;
const FULL_DAY_WON = 332;

// 가짜 내역 한 장의 줄 수와 전체 줄 수의 상한 — 잔액이 먼저 바닥나면 세 장보다 적다
export const FAKE_PAGE_SIZE = 16;
const MAX_ROWS = FAKE_PAGE_SIZE * 3;
const TODAY_MS = Date.UTC(2026, 9, 10);
const DAY_MS = 24 * 60 * 60 * 1000;
const dateOf = (daysAgo: number) =>
  new Date(TODAY_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);

// 맨 윗줄 잔액이 위의 금액과 같게, 늦은 것부터 거꾸로 잔액을 매긴다. 잔액이 바닥나면 거기가 첫 줄이다
export const fakeHistoryItems = (reward: RewardView) => {
  const items: RewardHistoryItem[] = [];
  const push = (item: Omit<RewardHistoryItem, 'id' | 'cycleId'>) =>
    items.push({ ...item, id: String(MAX_ROWS - items.length), cycleId: 7 });
  const closing = (
    type: 'RESET' | 'CYCLE_END',
    amountWon: number,
    balanceWon: number,
  ) =>
    push({
      type,
      activityType: null,
      date: dateOf(1),
      occurredAt: `${dateOf(0)}T00:00:00+09:00`,
      amountWon,
      balanceWon,
      completionId: null,
    });

  let balanceWon = reward.current?.balanceWon ?? reward.pendingRefundWon;
  // 오늘 줄은 위의 오늘 칸이 말하는 금액만큼만 — 아침에 한 것부터 채워진 것으로 본다
  let todayLeftWon = FULL_DAY_WON - (reward.today?.earnedWon ?? 0);
  // 적립 줄이 시작되는 날. 오늘이 없는 사람(끝남·확인 중)은 오늘 줄을 전부 건너뛰어 어제부터 쌓인다
  let firstDay = 0;

  // 어제 쉬었으면 그 줄이 맨 위고, 그 앞은 사라진 금액까지 쌓아 온 날들이다
  if (reward.lostYesterdayWon > 0) {
    closing('RESET', -reward.lostYesterdayWon, 0);
    balanceWon = reward.lostYesterdayWon;
    firstDay = 2;
  }
  // 기간이 끝났으면 넘어간 금액을 알리는 줄이 맨 위다
  if (reward.state === 'ENDED') closing('CYCLE_END', 0, balanceWon);

  for (let step = 0; items.length < MAX_ROWS; step += 1) {
    const day = firstDay + Math.floor(step / FULL_DAY_LATEST_FIRST.length);
    const [activityType, amountWon, time] =
      FULL_DAY_LATEST_FIRST[step % FULL_DAY_LATEST_FIRST.length];
    // 오늘 아직 하지 않은 것은 건너뛴다
    if (day === 0 && todayLeftWon > 0) {
      todayLeftWon -= amountWon;
      continue;
    }
    if (balanceWon < amountWon) break;
    push({
      type: 'EARN',
      activityType,
      date: dateOf(day),
      occurredAt: `${dateOf(day)}T${time}:00+09:00`,
      amountWon,
      balanceWon,
      completionId: MAX_ROWS - items.length,
    });
    balanceWon -= amountWon;
  }
  return items;
};
