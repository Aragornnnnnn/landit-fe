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

// 가짜 내역이 서버를 흉내 내는 방식 — 세 장 이어 받기 / 둘째 장에서 한 번 실패 / 한 줄도 없음
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

export const isRecordCase = (name: string): name is keyof typeof RECORD_CASES =>
  name in RECORD_CASES;

// 하루를 다 채웠을 때 쌓이는 여섯 줄 — [무엇을, 금액, 시각]
const FULL_DAY = [
  ['SCENARIO', 111, '08:12'],
  ['EXPRESSION', 11, '08:21'],
  ['EXPRESSION', 11, '08:24'],
  ['EXPRESSION', 11, '08:27'],
  ['EXPRESSION', 77, '08:31'],
  ['SMALLTALK', 111, '21:40'],
] as const;
// 세 장으로 나눠 받을 만큼만 만든다
const MAX_ROWS = 48;
const TODAY_MS = Date.UTC(2026, 9, 10);
const DAY_MS = 24 * 60 * 60 * 1000;
const dateOf = (daysAgo: number) =>
  new Date(TODAY_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);

// 맨 윗줄 잔액이 위의 금액과 같게, 늦은 것부터 거꾸로 잔액을 매긴다. 잔액이 바닥나면 거기가 첫 줄이다
export const fakeHistoryItems = (reward: RewardView) => {
  const items: RewardHistoryItem[] = [];
  const push = (item: Omit<RewardHistoryItem, 'id' | 'cycleId'>) =>
    items.push({ ...item, id: String(MAX_ROWS - items.length), cycleId: 7 });

  let balanceWon = reward.current?.balanceWon ?? reward.pendingRefundWon;
  // 어제 쉬었으면 그 줄이 맨 위고, 그 앞은 사라진 금액까지 쌓아 온 날들이다
  if (reward.lostYesterdayWon > 0) {
    push({
      type: 'RESET',
      activityType: null,
      date: dateOf(1),
      occurredAt: `${dateOf(0)}T00:00:00+09:00`,
      amountWon: -reward.lostYesterdayWon,
      balanceWon: 0,
      completionId: null,
    });
    balanceWon = reward.lostYesterdayWon;
  }

  for (let day = reward.lostYesterdayWon > 0 ? 2 : 0; ; day += 1) {
    for (const [activityType, amountWon, time] of FULL_DAY.toReversed()) {
      if (items.length >= MAX_ROWS || balanceWon < amountWon) return items;
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
  }
};
