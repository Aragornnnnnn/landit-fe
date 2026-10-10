// 아래 고정 환급 신청 버튼이 무엇을 말할지 — 기간을 마친 금액이 있을 때만 열린다
import type { RewardView } from '@/features/reward/api/reward';
import { formatWon } from '@/shared/lib/won';

interface ApplyButton {
  open: boolean;
  label: string;
}

export const applyButtonOf = (view: RewardView): ApplyButton => {
  // 새 회차를 쌓는 중이어도 지난 회차의 금액은 신청할 수 있다
  if (view.pendingRefundWon > 0)
    return {
      open: true,
      label: `${formatWon(view.pendingRefundWon)} 환급 신청하기`,
    };
  if (view.state === 'ENDED')
    return { open: false, label: '환급 신청할 금액이 없어요' };
  if (view.remainingDays === null)
    return { open: false, label: '확인이 끝나면 환급 신청할 수 있어요' };
  return {
    open: false,
    label: `${view.remainingDays}일 뒤 환급 신청할 수 있어요`,
  };
};
