// 환급 조회와 완료 영수증 — 환급 전용 API를 그대로 미러한다 (백엔드 RewardView·RewardCompletion·RewardActivity).
// 스트릭 응답에도 환급 값이 덧붙어 오지만 쓰지 않는다 — 환급은 스트릭과 따로 묻고 따로 그린다
import { api } from '@/shared/api/client';

// 한 종류의 활동이 그날 어디까지 찼는지
export interface RewardActivity {
  activityType: 'SCENARIO' | 'SMALLTALK' | 'EXPRESSION';
  earnedWon: number;
  // 그 활동 몫을 다 채웠는지
  completed: boolean;
  targetCount: number;
  completedCount: number;
  // 다음 완료 하나로 받을 금액. 대상이 아직 안 정해졌으면 null
  nextEarnableWon: number | null;
  // 지금부터 이 활동만 이어서 다 끝내면 받는 금액. 다른 활동이 끼면 1원 달라질 수 있어 합산하지 않는다. 미확정이면 null
  remainingWon: number | null;
}

// 회차 안의 하루
export interface RewardCycleDay {
  // KST 날짜 (yyyy-MM-dd)
  date: string;
  startsAt: string;
  endsAt: string;
  // 그날 인정된 활동이 하나라도 있는지
  achieved: boolean;
  // 그날이 마감됐는지
  closed: boolean;
  changeWon: number;
  // 그날을 반영한 뒤의 잔액
  balanceWon: number;
  earnedWon: number;
  // 그날 아무것도 안 해서 사라진 금액
  resetWon: number;
  maximumWon: number | null;
  fullyAchieved: boolean;
  activities: RewardActivity[];
}

// 결제 한 번이 만든 환급 회차
export interface RewardCycle {
  id: number;
  productId: string;
  startsAt: string;
  endsAt: string;
  // 이 회차를 다 채우면 돌려받는 금액
  maximumWon: number;
  eligibleDays: number;
  balanceWon: number;
  carriedNumerator: number;
  phase: string;
  eligibility: string;
  reviewReason: string | null;
  // 요약 조회의 현재 회차에만 채워져 온다
  days: RewardCycleDay[];
  policyVersion: string;
  calculationDenominator: number;
}

// 환급이 지금 어느 국면인가
export type RewardState =
  // 회차가 돌고 있다 — 매일 쌓는 중
  | 'ACTIVE'
  // 갱신하지 않아 회차가 끝났다 — 돌려받을 금액만 남았다
  | 'ENDED'
  // 결제는 됐는데 환급 쪽 결제 정보가 아직 처리되지 않았다
  | 'PENDING'
  // 환불·계정 이전 등으로 서버가 결제 내역을 다시 보는 중
  | 'REVIEW'
  // 환급 상품과 상관없는 사람
  | 'NONE';

// 서버가 정한 오늘 — 폰 시계로 날짜를 세지 않는다
export interface RewardToday {
  // KST 날짜 (yyyy-MM-dd)
  date: string;
  earnedWon: number;
  maximumWon: number | null;
  fullyAchieved: boolean;
  activities: RewardActivity[];
}

export interface RewardView {
  state: RewardState;
  availability: string;
  reason: string | null;
  currency: string;
  todayMaximumWon: number;
  todayAchieved: boolean;
  computedAt: string;
  // 지금 돌고 있는 회차. 없으면 null — 환급 상품을 산 적이 없거나, 갱신하지 않아 끝났다
  current: RewardCycle | null;
  // 기간을 마친 회차들에 보존된 환급 예정액. 지급 완료 금액이 아니다
  pendingRefundWon: number;
  // 기간은 끝났는데 검토 중이라 pendingRefundWon에 들지 않은 금액. 없으면 0
  heldRefundWon: number;
  // 쌓는 중(ACTIVE)일 때만 온다
  today: RewardToday | null;
  // 오늘을 포함해 남은 날짜 수. 쌓는 중일 때만 온다
  remainingDays: number | null;
  // 어제 통째로 쉬어 사라진 금액. 없으면 0
  lostYesterdayWon: number;
}

// 학습 하나를 끝낸 순간의 적립 영수증 — 완료 응답의 reward로 온다
export interface RewardReceipt {
  // 같은 완료를 다시 요청해도 유지된다. 같은 영수증을 두 번 띄우지 않는 데 쓴다
  completionId: number;
  cycleId: number | null;
  activityType: RewardActivity['activityType'];
  learningDate: string;
  // 미확정 PENDING은 금액이 null, 확정 0원은 NO_ADDITIONAL_REWARD
  status: 'EARNED' | 'NO_ADDITIONAL_REWARD' | 'PENDING';
  reason: string | null;
  earnedWon: number | null;
  // 이 완료까지 반영한 쌓인 금액. 미확정이면 null
  balanceWon: number | null;
  todayEarnedWon: number | null;
  todayMaximumWon: number | null;
  todayFullyAchieved: boolean;
  activities: RewardActivity[];
  computedAt: string;
  calculationVersion: number | null;
  currency: string;
}

// 환급 내역 한 줄 — 통장처럼 완료 하나가 한 줄이다
export interface RewardHistoryItem {
  // 종류와 원본으로 만든 고정 문자열. 뜻을 읽지 않고 중복을 거르는 열쇠로만 쓴다
  id: string;
  // EARN 적립 · RESET 하루 쉬어 초기화 · CYCLE_END 기간 종료. 종류는 늘어날 수 있어 모르는 값은 건너뛴다
  type: string;
  // EARN일 때만
  activityType: RewardActivity['activityType'] | null;
  // 이 줄이 속한 KST 날짜 (yyyy-MM-dd). 초기화는 일어난 시각이 다음 날 0시여도 쉰 날에 붙는다
  date: string;
  occurredAt: string;
  // 받았으면 양수, 사라졌으면 음수
  amountWon: number;
  // 이 줄까지 반영한 잔액
  balanceWon: number;
  cycleId: number;
  // EARN일 때만. 영수증의 completionId와 같은 값
  completionId: number | null;
}

export interface RewardHistoryPage {
  items: RewardHistoryItem[];
  // 다음 장을 받을 때 그대로 돌려보내는 값. 더 없으면 null
  nextCursor: string | null;
}

export const getMyRewards = () => api.get<RewardView>('/api/v1/me/rewards');

// 한 번에 받는 줄 수 — 하루를 다 채우면 여섯 줄이라 일주일쯤이 한 장이다
const HISTORY_PAGE_SIZE = 40;

// cursor는 앞 장이 준 nextCursor를 그대로 돌려보낸다 — 첫 장은 null
export const getRewardHistory = (cursor: string | null) =>
  api.get<RewardHistoryPage>(
    `/api/v1/me/rewards/history?limit=${HISTORY_PAGE_SIZE}${
      cursor === null ? '' : `&cursor=${encodeURIComponent(cursor)}`
    }`,
  );
