// 화면 아래에 늘 붙어 있는 환급 신청 버튼 — 기간을 마친 금액이 생기기 전에는 흐린 채로 언제 열리는지 말한다
import type { RewardView } from '@/features/reward/api/reward';
import { Button } from '@/shared/ui/Button';

import { applyButtonOf } from '../_model/apply-button';

export const RefundApplyButton = ({
  reward,
  onApply,
}: {
  reward: RewardView;
  onApply: () => void;
}) => {
  const { open, label } = applyButtonOf(reward);

  return (
    <Button disabled={!open} onClick={onApply}>
      {label}
    </Button>
  );
};
