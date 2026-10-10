// 환급 화면이 무엇을 말할지 정하는 규칙 — 쌓인 금액과 오늘 할 일을 국면에 맞춰 말로 바꾼다
import { formatWon } from '@/shared/lib/won';

import type { RewardActivity, RewardState, RewardView } from '../api/reward';

// 서버가 모르는 값을 줘도 물어볼 수 있게 string으로 넓혀 둔다
const PARTICIPANT_STATES: readonly string[] = [
  'ACTIVE',
  'ENDED',
  'PENDING',
  'REVIEW',
] satisfies RewardState[];

// 환급과 상관없는 사람은 null — 화면들이 "참여자인가"를 이 한 곳에서 가른다.
// 모르는 국면도 null이다 — 쌓는 중인 것처럼 그리느니 환급 표시를 접는다
export const participantOf = (view: RewardView) =>
  PARTICIPANT_STATES.includes(view.state) ? view : null;

// 도는 회차에 쌓인 금액. 도는 회차가 없으면(끝났거나 결제 확인 중) null
export const balanceOf = (view: RewardView) => view.current?.balanceWon ?? null;

// 쌓인 게 있는데 오늘이 아직인가 — 자정에 사라질 금액이 걸려 있다.
// 오늘은 쌓는 중일 때만 오니, 오지 않은 걸 "오늘 0원"으로 읽지 않는다
export const atRiskOf = (view: RewardView) =>
  view.state === 'ACTIVE' &&
  view.today?.earnedWon === 0 &&
  (balanceOf(view) ?? 0) > 0;

export interface RewardHeroMessage {
  // 큰 글자 위의 꼬리표 — 이 숫자가 무엇인지. 숫자가 없으면 null
  label: string | null;
  // 큰 글자로 보여 줄 금액. 아직 모르면 null이고 title이 대신 선다
  amountWon: number | null;
  title: string | null;
  guide: string;
}

// 쌓는 중인 사람에게 오늘 무엇을 말할지 — 오늘 한 만큼, 걸려 있는 금액, 어제 잃은 금액 순으로 본다
const todayGuideOf = (view: RewardView, balance: number) => {
  const earned = view.today?.earnedWon ?? 0;
  if (view.today?.fullyAchieved) return '오늘 몫을 다 채웠어요';
  if (earned > 0) {
    const maximum = view.today?.maximumWon ?? null;
    return maximum === null
      ? '오늘 더 받을 수 있어요'
      : `오늘 ${formatWon(maximum - earned)} 더 받을 수 있어요`;
  }
  if (balance > 0)
    return `오늘 하나도 안 하면 ${formatWon(balance)}이 사라져요`;
  if (view.lostYesterdayWon > 0)
    return `어제 쉬어서 ${formatWon(view.lostYesterdayWon)}이 사라졌어요\n오늘부터 다시 쌓을 수 있어요`;
  return '오늘 대화 하나로 쌓기 시작해요';
};

export const rewardHeroOf = (view: RewardView): RewardHeroMessage => {
  const balance = balanceOf(view);

  if (view.state === 'ENDED')
    return {
      label: '돌려받을 금액',
      amountWon: view.pendingRefundWon,
      title: null,
      guide:
        view.pendingRefundWon > 0
          ? '기간을 끝까지 마쳤어요\n환급 신청하면 계좌로 보내 드려요'
          : '기간이 끝났어요\n다시 시작하면 처음부터 쌓을 수 있어요',
    };

  if (view.state === 'PENDING')
    return {
      label: null,
      amountWon: null,
      title: '결제를 확인하고 있어요',
      guide: '확인이 끝나면 여기에 쌓이기 시작해요',
    };

  if (view.state === 'REVIEW')
    return {
      // 기간을 마친 뒤 검토에 들어가면 도는 회차가 없다 — 보류된 금액이 대신 선다
      label: balance === null ? '확인 중인 금액' : '쌓인 환급액',
      amountWon: balance ?? view.heldRefundWon,
      title: null,
      guide: '결제 내역을 확인하고 있어요\n쌓인 금액은 그대로 보관돼요',
    };

  return {
    label: '쌓인 환급액',
    amountWon: balance ?? 0,
    title: null,
    guide: todayGuideOf(view, balance ?? 0),
  };
};

// 오늘 세 칸 — 화면에 놓이는 순서는 학습 순서(시나리오 → 표현 → 스몰톡)다
const SLOT_ORDER: RewardActivity['activityType'][] = [
  'SCENARIO',
  'EXPRESSION',
  'SMALLTALK',
];
const SLOT_LABEL: Record<RewardActivity['activityType'], string> = {
  SCENARIO: '시나리오',
  EXPRESSION: '표현',
  SMALLTALK: '스몰톡',
};

export interface TodaySlot {
  type: RewardActivity['activityType'];
  label: string;
  // 0~1. 표현은 끝낸 개수만큼 찬다
  progress: number;
  // 이 활동으로 오늘 받은 금액
  earnedWon: number;
  // 이 활동에서 오늘 더 받을 수 있는 금액 전부. 다 채웠으면 0, 아직 정해지지 않았으면 null
  remainingWon: number | null;
  // 표현처럼 여러 개를 끝내야 하는 활동의 진행 ("2/4"). 하나짜리는 null
  countLabel: string | null;
}

export const todaySlotsOf = (activities: RewardActivity[]): TodaySlot[] =>
  SLOT_ORDER.flatMap((type) => {
    const activity = activities.find((item) => item.activityType === type);
    // 그날 대상이 없는 활동은 칸을 만들지 않는다 — 배정된 표현이 없는 날 서버는 표현 몫을 두 대화에 나눠 준다
    if (!activity || activity.targetCount === 0) return [];
    return [
      {
        type,
        label: SLOT_LABEL[type],
        progress: activity.completed
          ? 1
          : activity.completedCount / activity.targetCount,
        earnedWon: activity.earnedWon,
        remainingWon: activity.remainingWon,
        countLabel:
          activity.targetCount > 1
            ? `${activity.completedCount}/${activity.targetCount}`
            : null,
      },
    ];
  });
