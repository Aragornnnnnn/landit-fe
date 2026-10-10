// 테스트가 같이 쓰는 환급 응답 견본 — 6개월 상품으로 쌓는 중이고 오늘은 아직인 사람이 기본이다
import type {
  RewardActivity,
  RewardCycle,
  RewardReceipt,
  RewardToday,
  RewardView,
} from '../api/reward';

export const rewardActivity = (
  activityType: RewardActivity['activityType'],
  patch: Partial<RewardActivity> = {},
): RewardActivity => ({
  activityType,
  earnedWon: 0,
  completed: false,
  targetCount: activityType === 'EXPRESSION' ? 4 : 1,
  completedCount: 0,
  nextEarnableWon: activityType === 'EXPRESSION' ? 11 : 111,
  remainingWon: activityType === 'EXPRESSION' ? 110 : 111,
  ...patch,
});

export const rewardToday = (patch: Partial<RewardToday> = {}): RewardToday => ({
  date: '2026-10-10',
  earnedWon: 0,
  maximumWon: 332,
  fullyAchieved: false,
  activities: [
    rewardActivity('SCENARIO'),
    rewardActivity('EXPRESSION'),
    rewardActivity('SMALLTALK'),
  ],
  ...patch,
});

export const rewardCycle = (patch: Partial<RewardCycle> = {}): RewardCycle => ({
  id: 7,
  productId: 'landit_premium_6m',
  startsAt: '2026-10-01T00:00:00+09:00',
  endsAt: '2027-04-01T00:00:00+09:00',
  maximumWon: 59900,
  eligibleDays: 182,
  balanceWon: 12300,
  carriedNumerator: 0,
  phase: 'ACTIVE',
  eligibility: 'ELIGIBLE',
  reviewReason: null,
  days: [],
  policyVersion: '1',
  calculationDenominator: 1,
  ...patch,
});

export const rewardView = (patch: Partial<RewardView> = {}): RewardView => ({
  state: 'ACTIVE',
  availability: 'AVAILABLE',
  reason: null,
  currency: 'KRW',
  todayMaximumWon: 332,
  todayAchieved: false,
  computedAt: '2026-10-10T03:00:00Z',
  current: rewardCycle(),
  pendingRefundWon: 0,
  heldRefundWon: 0,
  today: rewardToday(),
  remainingDays: 173,
  lostYesterdayWon: 0,
  ...patch,
});

// 기간을 마쳐 돌려받을 금액만 남은 사람
export const endedRewardView = (pendingRefundWon: number): RewardView =>
  rewardView({
    state: 'ENDED',
    current: null,
    today: null,
    remainingDays: null,
    pendingRefundWon,
  });

export const rewardReceipt = (
  patch: Partial<RewardReceipt> = {},
): RewardReceipt => ({
  completionId: 1,
  cycleId: 7,
  activityType: 'SCENARIO',
  learningDate: '2026-10-10',
  status: 'EARNED',
  reason: null,
  earnedWon: 111,
  balanceWon: 12411,
  todayEarnedWon: 111,
  todayMaximumWon: 332,
  todayFullyAchieved: false,
  activities: [],
  computedAt: '2026-10-10T03:00:00Z',
  calculationVersion: 1,
  currency: 'KRW',
  ...patch,
});
