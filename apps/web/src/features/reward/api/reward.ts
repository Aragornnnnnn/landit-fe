// 환급 조회 — 환급 전용 API를 그대로 미러한다 (백엔드 RewardView·RewardActivity·RewardHistory). 완료 응답의 영수증은 쓰지 않아 옮기지 않았다 — 금액은 요약을 다시 받아 맞춘다
// 스트릭 응답에도 환급 값이 덧붙어 오지만 쓰지 않는다 — 환급은 스트릭과 따로 묻고 따로 그린다
import { api } from '@/shared/api/client';

// 그날의 활동이 어디까지 찼는지 — 환급은 오늘의 시나리오로만 쌓인다
export interface RewardActivity {
  activityType: 'SCENARIO';
  earnedWon: number;
  // 그 활동 몫을 다 채웠는지
  completed: boolean;
  targetCount: number;
  completedCount: number;
  // 다음 완료 하나로 받을 금액. 대상이 아직 안 정해졌으면 null
  nextEarnableWon: number | null;
  // 지금부터 이 활동을 끝내면 받는 금액. 미확정이면 null
  remainingWon: number | null;
}

// 회차 안의 하루
export interface RewardCycleDay {
  // KST 날짜 (yyyy-MM-dd)
  date: string;
  startsAt: string;
  endsAt: string;
  // 그날 오늘의 시나리오를 끝냈는지
  achieved: boolean;
  // 그날이 마감됐는지
  closed: boolean;
  changeWon: number;
  // 그날을 반영한 뒤의 잔액
  balanceWon: number;
  earnedWon: number;
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
  phase: string;
  eligibility: string;
  reviewReason: string | null;
  // 요약 조회의 현재 회차에만 채워져 온다
  days: RewardCycleDay[];
  policyVersion: string;
}

// 환급이 지금 어느 국면인가
export type RewardState =
  // 회차가 돌고 있다 — 매일 쌓는 중
  | 'ACTIVE'
  // 기간이 끝났다 — 돌려받을 금액만 남았다
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
  // 지금 돌고 있는 회차. 없으면 null — 환급 상품을 산 적이 없거나, 기간이 끝났다
  current: RewardCycle | null;
  // 기간을 마친 회차들에 보존된 환급 예정액. 지급 완료 금액이 아니다
  pendingRefundWon: number;
  // 기간은 끝났는데 검토 중이라 pendingRefundWon에 들지 않은 금액. 없으면 0
  heldRefundWon: number;
  // 쌓는 중(ACTIVE)일 때만 온다
  today: RewardToday | null;
  // 오늘을 포함해 남은 날짜 수. 쌓는 중일 때만 온다
  remainingDays: number | null;
  // 기간이 끝나 출금할 수 있는 금액. 실제 지급 완료가 아니다
  withdrawableWon: number;
  // 출금할 수 있는 금액이 있는가
  withdrawalAvailable: boolean;
  // 새 100일 챌린지를 살 수 있는가 — 도는 챌린지가 있거나 결제를 검토 중이면 거짓
  purchaseAvailable: boolean;
  // 도는 챌린지가 끝나는 시각. 그 뒤에 다시 살 수 있다. 챌린지가 없으면 null
  purchaseAvailableAt: string | null;
  // 무료로 한 대화를 챌린지였다면 받았을 금액. 무료 대상이 아니거나 챌린지를 산 적이 있으면 null
  preview: RewardPreview | null;
}

// 결제했으면 받을 수 있었던 금액 — 표시용이라 결제해도 적립금으로 바뀌지 않는다
export interface RewardPreview {
  // 기간 제한 없이 쌓인 금액. 출금·환급 대상이 아니다
  balanceWon: number;
  // 쌓인 KST 날짜 수 — 오늘을 했으면 오늘도 들어 있다
  completedDays: number;
  // 오늘 무료로 쌓인 금액
  todayEarnedWon: number;
  // 하루 몫
  dailyAmountWon: number;
  // 지금 무료라서 쌓이는 중인가
  accruing: boolean;
}

// 환급 내역 한 줄 — 통장처럼 완료 하나가 한 줄이다
export interface RewardHistoryItem {
  // 종류와 원본으로 만든 고정 문자열. 뜻을 읽지 않고 중복을 거르는 열쇠로만 쓴다
  id: string;
  // EARN 적립 · CYCLE_END 기간 종료. 종류는 늘어날 수 있어 모르는 값은 건너뛴다
  type: string;
  // EARN일 때만
  activityType: RewardActivity['activityType'] | null;
  // 이 줄이 속한 KST 날짜 (yyyy-MM-dd)
  date: string;
  occurredAt: string;
  // 적립이면 받은 금액, 기간 종료면 0
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

// 한 번에 받는 줄 수 — 하루에 한 줄이라 한 달 남짓이 한 장이다
const HISTORY_PAGE_SIZE = 40;

const pageQueryOf = (cursor: string | null) =>
  `limit=${HISTORY_PAGE_SIZE}${
    cursor === null ? '' : `&cursor=${encodeURIComponent(cursor)}`
  }`;

// cursor는 앞 장이 준 nextCursor를 그대로 돌려보낸다 — 첫 장은 null
export const getRewardHistory = (cursor: string | null) =>
  api.get<RewardHistoryPage>(
    `/api/v1/me/rewards/history?${pageQueryOf(cursor)}`,
  );

// 무료 적립 기록 한 줄 — 하루에 한 줄이다. 지난 기록을 한꺼번에 채운 줄은 시각이 없어 날짜만 온다
export interface RewardPreviewHistoryItem {
  // KST 날짜 (yyyy-MM-dd)
  date: string;
  amountWon: number;
}

export interface RewardPreviewHistoryPage {
  items: RewardPreviewHistoryItem[];
  // 마지막 줄의 날짜. 더 없으면 null
  nextCursor: string | null;
}

// 최신 날짜부터. 무료 대상이 아니면 빈 목록이 온다
export const getRewardPreviewHistory = (cursor: string | null) =>
  api.get<RewardPreviewHistoryPage>(
    `/api/v1/me/rewards/preview/history?${pageQueryOf(cursor)}`,
  );
