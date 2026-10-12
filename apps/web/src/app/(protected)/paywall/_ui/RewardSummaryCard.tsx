// 환급 챌린지 결제 요약 카드 — 상품이 하나라 고를 것이 없다. 영수증처럼 내는 돈, 돌려받는 돈, 다 채웠을 때 실제 부담금을 한 줄씩 적는다.
// 주황은 돌려받는 금액에만 쓴다
import { formatWon } from '@/features/subscription/lib/won';
import { GOLD_GRADIENT } from '@/features/subscription/ui/premium-brand';

import type { RewardPlan } from '../_model/paywall-content';

export const RewardSummaryCard = ({ plan }: { plan: RewardPlan }) => {
  const { days, price, dailyRefund, maxRefund } = plan;

  return (
    <div className="relative pt-3">
      {/* 알약은 카드 위 테두리에 걸친다 */}
      <span
        className="absolute top-0 left-5 z-10 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-[#4a2f00] shadow-[0_4px_10px_rgba(0,0,0,0.12)]"
        style={{ backgroundImage: GOLD_GRADIENT }}
      >
        {days}일 환급 챌린지
      </span>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
        <dl className="flex flex-col gap-3 px-5 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <dt className="text-[15px] font-bold text-foreground">
              프리미엄 {days}일
            </dt>
            <dd className="text-xl font-bold text-foreground tabular-nums">
              {formatWon(price)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            {/* 작은 글자는 큰 글자의 밑줄이 아니라 가운데에 맞춘다 */}
            <dt className="flex items-center text-[15px] font-bold text-foreground">
              최대 환급
              <span className="ml-1.5 text-[12px] font-medium text-muted-foreground/70">
                ({days}일 × {formatWon(dailyRefund)})
              </span>
            </dt>
            <dd className="animate-text-shine bg-[linear-gradient(110deg,var(--color-primary)_42%,#ffe2c2_50%,var(--color-primary)_58%)] bg-[length:250%_100%] bg-clip-text text-xl font-bold text-transparent tabular-nums">
              − {formatWon(maxRefund)}
            </dd>
          </div>
        </dl>
        <div className="flex items-center justify-between bg-secondary px-5 py-3">
          <span className="text-sm font-bold text-muted-foreground">
            실제 부담금
          </span>
          <span className="text-xl font-bold text-foreground tabular-nums">
            {formatWon(price - maxRefund)}
          </span>
        </div>
      </div>
    </div>
  );
};
