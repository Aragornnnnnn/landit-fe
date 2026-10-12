// 환급 화면이 무엇을 말할지 정하는 규칙 — 쌓인 금액과 오늘 몫을 받았는지를 국면에 맞춰 말로 바꾼다
import { formatWon } from '@/shared/lib/won';

import type { RewardState, RewardView } from '../api/reward';

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

// 도는 회차의 하루 몫 — 다 채우면 받는 금액을 대상 날짜 수로 나눈 값. 도는 회차가 없으면 null
export const dailyWonOf = (view: RewardView) =>
  view.current && view.current.eligibleDays > 0
    ? Math.floor(view.current.maximumWon / view.current.eligibleDays)
    : null;

// 오늘 받은 금액 — 쌓는 중이 아니면(오늘이 오지 않으면) 0
export const earnedTodayWonOf = (view: RewardView) =>
  view.today?.earnedWon ?? 0;

// 오늘 아직 받을 수 있는 금액 — 쌓는 중인데 오늘의 시나리오가 아직일 때만 있다. 그림·시계·문구가 이 한 판정을 같이 본다
export const todayLeftWonOf = (view: RewardView) =>
  view.state === 'ACTIVE' && view.today != null && view.today.earnedWon === 0
    ? (view.today.maximumWon ?? view.todayMaximumWon)
    : 0;

// 가장 최근에 마감된 날부터 거슬러, 오늘의 시나리오를 하지 않고 넘긴 날이 며칠 이어졌는지. 오늘은 아직 마감 전이라 세지 않는다
export const restDaysOf = (view: RewardView) => {
  const closed = (view.current?.days ?? [])
    .filter((day) => day.closed)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastDone = closed.findIndex((day) => day.achieved);
  return lastDone === -1 ? closed.length : lastDone;
};

// 이만큼 쉬면 말과 그림이 달라진다 — 하루는 누구나 쉰다
export const LONG_REST_DAYS = 2;

export interface RewardHeroMessage {
  // 큰 글자 위의 꼬리표 — 이 숫자가 무엇인지. 숫자가 없으면 null
  label: string | null;
  // 큰 글자로 보여 줄 금액. 아직 모르면 null이고 title이 대신 선다
  amountWon: number | null;
  title: string | null;
  guide: string;
}

// 쌓는 중인 사람에게 오늘 무엇을 말할지 — 오늘 몫을 받았는지, 아직인지 둘뿐이다. 쉰 날에도 모은 금액은 그대로라 잃는 말은 하지 않는다
const todayGuideOf = (view: RewardView) => {
  if ((view.today?.earnedWon ?? 0) > 0)
    return `오늘 ${formatWon(view.today?.earnedWon ?? 0)}을 받았어요`;
  const invite = `오늘의 시나리오를 하면 ${formatWon(view.today?.maximumWon ?? view.todayMaximumWon)}을 받아요`;
  const rested = restDaysOf(view);
  return rested >= LONG_REST_DAYS
    ? `${rested}일째 쉬고 있어요\n${invite}`
    : invite;
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
          ? '기간을 끝까지 마쳤어요\n곧 환급 신청할 수 있어요'
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
    guide: todayGuideOf(view),
  };
};

// 헤더 알약이나 내 정보 타일처럼 좁은 자리에 놓는 요약 — 꼬리표와 금액은 환급 화면의 큰 글자와 같다
export interface RewardBadge {
  label: string;
  // 아직 모르면 null (결제 확인 중)
  amountWon: number | null;
  // 금액 아래 한 줄
  note: string;
  // 쌓는 중인데 오늘의 시나리오가 아직이면 idle, 그 밖에는 kept
  mood: 'kept' | 'idle';
}

// 좁은 자리에 적는 금액 글자 — 결제를 확인하는 동안에는 금액을 모른다
export const badgeAmountOf = (badge: RewardBadge) =>
  badge.amountWon === null ? '확인 중' : formatWon(badge.amountWon);

// 쌓는 중인 사람의 오늘 — 기분과 그 아래 한 줄을 같이 정한다
const activeBadgeOf = (view: RewardView): Pick<RewardBadge, 'mood' | 'note'> =>
  (view.today?.earnedWon ?? 0) > 0
    ? { mood: 'kept', note: '오늘 몫을 받았어요' }
    : { mood: 'idle', note: '오늘의 시나리오가 남았어요' };

// 쌓는 중이 아닌 국면의 한 줄 — 여기 없으면 쌓는 중이다
const SETTLED_NOTE: Partial<Record<RewardState, string>> = {
  ENDED: '곧 환급 신청할 수 있어요',
  PENDING: '결제를 확인하고 있어요',
  REVIEW: '결제 내역을 확인하고 있어요',
};

// 끝났고 돌려받을 금액도 없으면 null — 알릴 것이 없으니 그 자리는 원래 모습으로 돌아간다
export const rewardBadgeOf = (view: RewardView): RewardBadge | null => {
  if (view.state === 'ENDED' && view.pendingRefundWon === 0) return null;

  const { label, amountWon } = rewardHeroOf(view);
  const settledNote = SETTLED_NOTE[view.state];
  return {
    label: label ?? '환급',
    amountWon,
    ...(settledNote
      ? { mood: 'kept', note: settledNote }
      : activeBadgeOf(view)),
  };
};
