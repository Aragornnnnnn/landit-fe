// 테스트와 환급 점검 화면이 같이 쓰는 환급 응답 견본 — 100일 이용권(하루 500원)으로 쌓는 중이고 오늘은 아직인 사람이 기본이다
import type {
  RewardActivity,
  RewardCycle,
  RewardCycleDay,
  RewardToday,
  RewardView,
} from '../api/reward';

// 오늘의 시나리오 — 환급이 쌓이는 활동은 이것 하나다
export const rewardActivity = (
  patch: Partial<RewardActivity> = {},
): RewardActivity => ({
  activityType: 'SCENARIO',
  earnedWon: 0,
  completed: false,
  targetCount: 1,
  completedCount: 0,
  nextEarnableWon: 500,
  remainingWon: 500,
  ...patch,
});

export const rewardToday = (patch: Partial<RewardToday> = {}): RewardToday => ({
  date: '2026-10-10',
  earnedWon: 0,
  maximumWon: 500,
  fullyAchieved: false,
  activities: [rewardActivity()],
  ...patch,
});

// 오늘의 시나리오를 끝내 오늘 몫을 받은 날
export const earnedRewardToday = (): RewardToday =>
  rewardToday({
    earnedWon: 500,
    fullyAchieved: true,
    activities: [
      rewardActivity({
        earnedWon: 500,
        completed: true,
        completedCount: 1,
        nextEarnableWon: 0,
        remainingWon: 0,
      }),
    ],
  });

// 마감된 지난 하루 — 기본은 오늘의 시나리오를 하지 않고 넘긴 날
export const closedRewardDay = (
  date: string,
  achieved = false,
): RewardCycleDay => ({
  date,
  startsAt: `${date}T00:00:00+09:00`,
  endsAt: `${date}T24:00:00+09:00`,
  achieved,
  closed: true,
  changeWon: achieved ? 500 : 0,
  balanceWon: 4500,
  earnedWon: achieved ? 500 : 0,
  maximumWon: 500,
  fullyAchieved: achieved,
  activities: [],
});

export const rewardCycle = (patch: Partial<RewardCycle> = {}): RewardCycle => ({
  id: 7,
  productId: 'com.saynow.app.pass.50000',
  startsAt: '2026-10-01T00:00:00+09:00',
  endsAt: '2027-01-09T00:00:00+09:00',
  maximumWon: 50000,
  eligibleDays: 100,
  balanceWon: 4500,
  phase: 'ACTIVE',
  eligibility: 'ELIGIBLE',
  reviewReason: null,
  days: [],
  policyVersion: '1',
  ...patch,
});

export const rewardView = (patch: Partial<RewardView> = {}): RewardView => ({
  state: 'ACTIVE',
  availability: 'AVAILABLE',
  reason: null,
  currency: 'KRW',
  todayMaximumWon: 500,
  todayAchieved: false,
  computedAt: '2026-10-10T03:00:00Z',
  // 참여자는 무료 미리보기를 받지 않는다
  preview: null,
  current: rewardCycle(),
  pendingRefundWon: 0,
  heldRefundWon: 0,
  today: rewardToday(),
  remainingDays: 91,
  withdrawableWon: 0,
  withdrawalAvailable: false,
  purchaseAvailable: false,
  purchaseAvailableAt: '2027-01-09T00:00:00+09:00',
  ...patch,
});

// 기간을 마쳐 돌려받을 금액만 남은 사람 — 남은 금액은 곧 출금할 수 있는 금액이다
export const endedRewardView = (pendingRefundWon: number): RewardView =>
  rewardView({
    state: 'ENDED',
    todayMaximumWon: 0,
    current: null,
    today: null,
    remainingDays: null,
    pendingRefundWon,
    withdrawableWon: pendingRefundWon,
    withdrawalAvailable: pendingRefundWon > 0,
    purchaseAvailable: true,
    purchaseAvailableAt: null,
  });
