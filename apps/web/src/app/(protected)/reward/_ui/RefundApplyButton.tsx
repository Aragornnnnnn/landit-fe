// 화면 아래에 늘 붙어 있는 환급 신청 버튼 — 신청 방법이 정해지면 열고, 그 전에는 흐린 채로 언제 열리는지 말한다
import type { RewardView } from '@/features/reward/api/reward';
import { Button } from '@/shared/ui/Button';

import { applyButtonLabelOf } from '../_model/apply-button';

export const RefundApplyButton = ({ reward }: { reward: RewardView }) => (
  <Button disabled>{applyButtonLabelOf(reward)}</Button>
);
