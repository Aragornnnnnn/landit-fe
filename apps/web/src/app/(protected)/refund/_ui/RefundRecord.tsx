// 참여자가 보는 환급 화면의 본문 — 히어로, 접어 둔 규칙, 그 아래 내역
import type { RewardView } from '@/features/reward/api/reward';

import { RefundHero } from './RefundHero';
import { RefundHistoryFeed } from './RefundHistoryFeed';
import { RefundRulesToggle } from './RefundRulesToggle';

export const RefundRecord = ({ reward }: { reward: RewardView }) => (
  <div className="pb-8">
    <RefundHero reward={reward} />
    <RefundRulesToggle />
    <RefundHistoryFeed />
  </div>
);
