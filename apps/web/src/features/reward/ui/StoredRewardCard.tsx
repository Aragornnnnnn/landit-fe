// 환급을 시작하기 전에 보관 중인 돈 — 친구 초대로 받은 몫은 사라지지 않고, 시작하면 그 회차와 함께 돌려받는다
import { formatWon } from '@/shared/lib/won';

import { Coin } from './common/Coin';

export const StoredRewardCard = ({
  storedWon,
  className = '',
}: {
  storedWon: number;
  className?: string;
}) => (
  <div
    className={`flex items-center gap-3 rounded-2xl border border-[#ffc850]/60 bg-card px-4 py-3.5 ${className}`}
  >
    <Coin size={28} />
    <div className="min-w-0 flex-1">
      <p className="text-[15px] font-bold text-foreground">
        보관 중인 {formatWon(storedWon)}
      </p>
      <p className="mt-0.5 text-[12px] font-medium break-keep text-muted-foreground">
        친구 초대로 받은 돈은 사라지지 않아요. 시작하면 같이 돌려받아요
      </p>
    </div>
  </div>
);
