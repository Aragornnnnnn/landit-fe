// 아래 고정 환급 신청 버튼이 무엇을 말할지 — 신청 방법이 정해지기 전이라 아직 누를 수 없고, 언제 열리는지만 말한다
import type { RewardView } from '@/features/reward/api/reward';
import { formatWon } from '@/shared/lib/won';

export const applyButtonLabelOf = (view: RewardView) => {
  // 새 회차를 쌓는 중이어도 지난 회차의 금액이 먼저다
  if (view.pendingRefundWon > 0)
    return `${formatWon(view.pendingRefundWon)} · 곧 환급 신청할 수 있어요`;
  if (view.state === 'ENDED') return '환급 신청할 금액이 없어요';
  if (view.remainingDays === null) return '확인이 끝나면 환급 신청할 수 있어요';
  return `${view.remainingDays}일 뒤 환급 신청할 수 있어요`;
};
