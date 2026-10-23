// 참여자가 보는 환급 화면의 본문 — 히어로와 그 아래 내역. 규칙은 헤더의 안내 버튼이 연다
import type { RewardView } from '@/features/reward/api/reward';

import { RewardHero } from './RewardHero';

export const RewardRecord = ({
  reward,
  invite,
  history,
}: {
  reward: RewardView;
  // 쌓인 금액 아래 친구 초대 자리 — 환급 점검 미리보기는 비워 둔다
  invite?: React.ReactNode;
  // 내역 자리 — 실제 화면은 서버에서 받아 오는 내역을, 환급 점검은 가짜 내역을 끼운다
  history: React.ReactNode;
}) => (
  <div className="pb-8">
    <RewardHero reward={reward} />
    {invite}
    {history}
  </div>
);
