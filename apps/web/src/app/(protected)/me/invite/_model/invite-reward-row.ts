// 친구 초대 화면의 받은 보상 한 줄 — 언제, 친구가 무엇을 해서, 얼마를, 들어왔는지. 친구가 누구인지는 오지 않아 적지 않는다
import type { ReferralReward } from '@/features/referral/api/referral';
import { readSeoulDateParts } from '@/shared/lib/seoul-date';
import { formatWon } from '@/shared/lib/won';

export interface InviteRewardRow {
  id: number;
  dateLabel: string;
  time: string;
  title: string;
  amountLabel: string;
  statusLabel: string;
  // 실제로 적립됐는가 — 아니면 흐리게 그린다
  settled: boolean;
  // 환불로 빠졌는가 — 금액에 줄을 긋는다
  canceled: boolean;
}

const TITLE_BY_STAGE: Record<ReferralReward['stage'], string> = {
  SIGNUP: '친구가 가입했어요',
  PURCHASE: '친구가 결제했어요',
};

const STATUS_LABEL: Record<ReferralReward['status'], string> = {
  CREDITED: '적립됨',
  PENDING: '확인 중',
  REVIEW_REQUIRED: '확인 중',
  REVERSED: '취소됐어요',
};

export const inviteRewardRowOf = (reward: ReferralReward): InviteRewardRow => {
  const parts = readSeoulDateParts(reward.createdAt, {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // h23이라야 자정이 24시로 나오지 않는다
    hourCycle: 'h23',
  });
  return {
    id: reward.id,
    dateLabel: parts ? `${parts.month}.${parts.day}` : '',
    time: parts ? `${parts.hour}:${parts.minute}` : '',
    title: TITLE_BY_STAGE[reward.stage],
    amountLabel: `+${formatWon(reward.amountWon)}`,
    statusLabel: STATUS_LABEL[reward.status],
    settled: reward.status === 'CREDITED',
    canceled: reward.status === 'REVERSED',
  };
};
