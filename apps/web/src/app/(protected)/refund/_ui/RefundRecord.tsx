// 참여자가 보는 환급 화면의 본문 — 히어로, 접어 둔 규칙, 그 아래 내역
import type { RewardView } from '@/features/reward/api/reward';
import type { HistoryRow } from '@/features/reward/model/reward-history';
import { RefundHistory } from '@/features/reward/ui/RefundHistory';

import { RefundHero } from './RefundHero';
import { RefundRulesToggle } from './RefundRulesToggle';

export const RefundRecord = ({
  reward,
  history,
  loadingMore,
}: {
  reward: RewardView;
  // 내역을 받기 전에는 없다 — 그동안은 내역 자리를 비운다
  history?: HistoryRow[];
  loadingMore?: boolean;
}) => (
  <div className="pb-8">
    <RefundHero reward={reward} />
    <RefundRulesToggle />
    {history && <RefundHistory history={history} loadingMore={loadingMore} />}
  </div>
);
