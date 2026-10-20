// 환급 점검 케이스 — 서버 없이 화면을 열 가짜 환급 응답과 내역을 만든다
import type {
  RewardHistoryItem,
  RewardToday,
  RewardView,
} from '@/features/reward/api/reward';
import {
  earnedRewardToday,
  endedRewardView,
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

const active = (balanceWon: number, today: RewardToday) =>
  rewardView({ current: rewardCycle({ balanceWon }), today });

// 도는 챌린지가 없는 국면들이 같이 비우는 값
const OFF_CYCLE = { current: null, today: null, remainingDays: null };

export const RECORD_CASES = {
  yet: { reward: active(21000, rewardToday()), history: 'pages' },
  kept: { reward: active(21500, earnedRewardToday()), history: 'pages' },
  first: { reward: active(0, rewardToday()), history: 'empty' },
  ended: { reward: endedRewardView(32000), history: 'pages' },
  pending: {
    reward: rewardView({ state: 'PENDING', ...OFF_CYCLE }),
    history: 'empty',
  },
  review: {
    reward: rewardView({
      state: 'REVIEW',
      current: rewardCycle({ balanceWon: 21000 }),
      today: null,
      remainingDays: null,
    }),
    history: 'pages',
  },
  'history-fail': {
    reward: active(21500, earnedRewardToday()),
    history: 'failOnce',
  },
} satisfies Record<string, RecordCase>;

// 오늘의 시나리오를 막 끝낸 순간의 환급
export const EARNED_REWARD = RECORD_CASES.kept.reward;

// 열 수 있는 케이스 — 환급 화면 케이스에 결제 전 소개(대화 0~2일)·놓친 금액(3일째부터)·불러오는 중·받는 순간을 더한 것
const OTHER_CASES = [
  'intro',
  'introTalked',
  'missed',
  'missedTalked',
  'exitOffer',
  'loading',
  'coin',
  'earned',
] as const;
type RecordCaseName = keyof typeof RECORD_CASES;
export type CheckCase = RecordCaseName | (typeof OTHER_CASES)[number];

export const isRecordCase = (name: CheckCase): name is RecordCaseName =>
  Object.hasOwn(RECORD_CASES, name);

// 주소에 실려 온 케이스. 없거나 모르는 값이면 null — 그때는 목록을 보여 준다
export const readCheckCase = (raw: string | null): CheckCase | null =>
  [...Object.keys(RECORD_CASES), ...OTHER_CASES].find(
    (name): name is CheckCase => name === raw,
  ) ?? null;

// 오늘의 시나리오를 끝낸 날마다 한 줄 — 하루 몫과 끝낸 시각
const DAILY_WON = 500;
const EARNED_AT = '08:12';

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

  let balanceWon = reward.current?.balanceWon ?? reward.pendingRefundWon;
  // 기간이 끝났으면 넘어간 금액을 알리는 줄이 맨 위다
  if (reward.state === 'ENDED')
    push({
      type: 'CYCLE_END',
      activityType: null,
      date: dateOf(1),
      occurredAt: `${dateOf(0)}T00:00:00+09:00`,
      amountWon: 0,
      balanceWon,
      completionId: null,
    });

  // 오늘 몫을 받은 사람만 오늘 줄이 있다 — 그 밖에는 어제부터 쌓인다
  const firstDay = (reward.today?.earnedWon ?? 0) > 0 ? 0 : 1;
  for (
    let day = firstDay;
    items.length < MAX_ROWS && balanceWon >= DAILY_WON;
    day += 1
  ) {
    push({
      type: 'EARN',
      activityType: 'SCENARIO',
      date: dateOf(day),
      occurredAt: `${dateOf(day)}T${EARNED_AT}:00+09:00`,
      amountWon: DAILY_WON,
      balanceWon,
      completionId: MAX_ROWS - items.length,
    });
    balanceWon -= DAILY_WON;
  }
  return items;
};
