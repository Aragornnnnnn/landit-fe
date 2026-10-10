// 환급 플랜 카드 한 장(가로로 긴 줄) — 왼쪽은 사는 것(프리미엄 기간·결제 금액, 진한 글자), 오른쪽은 돌려받는 것(「최대 환급액」 라벨과 + 를 붙인 금액).
// 고른 카드는 주황 테두리로 켜지고, 아래 회색 줄이 챌린지에 성공하면 내는 「실제 부담」을 말한다. 주황은 선택 표시와 환급액에만 쓴다. 색·글자는 디자인 시스템 토큰만 쓴다
import { formatWon } from '@/features/subscription/lib/won';
import { GOLD_GRADIENT } from '@/features/subscription/ui/premium-brand';

import type { RefundPlan, RefundPlanId } from '../_model/paywall-content';

interface RefundPlanCardProps {
  plan: RefundPlan;
  selected: boolean;
  onSelect: (id: RefundPlanId) => void;
  /** 돋보이게 할 카드 — 금색 「전액 환급」 알약을 걸고 최대 환급액 위로 빛이 쓸고 지나간다. 전액 환급(6개월) 카드에만 켠다 */
  featured?: boolean;
}

export const RefundPlanCard = ({
  plan,
  selected,
  onSelect,
  featured = false,
}: RefundPlanCardProps) => {
  const { months, refundRate, price, maxRefund } = plan;
  const netCost = price - maxRefund;

  return (
    // 알약은 카드 위 테두리에 걸쳐 바깥으로 나가므로, 잘라 내는 버튼 바깥에 둔다
    <div className={`relative ${featured ? 'pt-3' : ''}`}>
      {featured && (
        <span
          className="absolute top-0 left-5 z-10 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-[#4a2f00] shadow-[0_4px_10px_rgba(0,0,0,0.12)]"
          style={{ backgroundImage: GOLD_GRADIENT }}
        >
          전액 환급
        </span>
      )}
      <button
        type="button"
        aria-label={`${months}개월 ${refundRate}% 환급 플랜`}
        aria-pressed={selected}
        onClick={() => onSelect(plan.id)}
        className={`relative w-full overflow-hidden rounded-2xl border-2 text-left transition-colors ${
          selected
            ? 'border-primary bg-card shadow-[0_6px_18px_rgba(0,0,0,0.08)]'
            : 'border-border bg-card'
        }`}
      >
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          {/* 고르는 칸이라는 표시 — 고르면 주황으로 채워진다 */}
          <span
            aria-hidden="true"
            className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              selected ? 'border-primary bg-primary' : 'border-border bg-card'
            }`}
          >
            {selected && (
              <span className="size-2 rounded-full bg-primary-foreground" />
            )}
          </span>

          {/* 사는 것 — 결제 금액이 이 카드의 가격 */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-muted-foreground">
              {months}개월 프리미엄
            </p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatWon(price)}
            </p>
          </div>

          {/* 돌려받는 것 — 가격과 헷갈리지 않게 라벨과 + 를 붙인다 */}
          <div className="shrink-0 text-right">
            {/* 전액 환급은 알약이 이미 말하므로 환급률을 붙이지 않는다 */}
            <p className="text-xs font-bold text-muted-foreground">
              최대 환급액{featured ? '' : ` · ${refundRate}%`}
            </p>
            <p
              className={`mt-0.5 text-2xl font-bold tracking-tight tabular-nums ${
                featured
                  ? 'animate-text-shine bg-[linear-gradient(110deg,var(--color-primary)_42%,#ffe2c2_50%,var(--color-primary)_58%)] bg-[length:250%_100%] bg-clip-text text-transparent'
                  : selected
                    ? 'text-primary'
                    : 'text-muted-foreground'
              }`}
            >
              +{formatWon(maxRefund)}
            </p>
          </div>
        </div>

        {/* 챌린지에 성공하면 실제로 내는 돈 — 선택과 상관없이 무채색이라 주황은 선택 표시와 환급액에만 남는다 */}
        <div className="flex items-center justify-between bg-secondary px-4 py-2">
          <span className="text-sm font-bold text-muted-foreground">
            챌린지 성공하면 실제 부담
          </span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatWon(netCost)}
          </span>
        </div>
      </button>
    </div>
  );
};
