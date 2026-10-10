// 참여자가 보는 환급 화면의 본문 — 히어로, 접어 둔 규칙, 그 아래 내역
import type { RewardView } from '@/features/reward/api/reward';

import { RefundHero } from './RefundHero';
import { RefundRulesToggle } from './RefundRulesToggle';

export const RefundRecord = ({
  reward,
  history,
}: {
  reward: RewardView;
  // 내역 자리 — 실제 화면은 서버에서 받아 오는 내역을, 환급 점검은 가짜 내역을 끼운다
  history: React.ReactNode;
}) => (
  <div className="pb-8">
    <RefundHero reward={reward} />
    <RefundRulesToggle />
    {history}
  </div>
);
