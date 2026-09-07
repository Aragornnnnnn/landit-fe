// 플랜 카드 한 장 — 누르면 선택된다. 선택 표시는 주황 테두리·옅은 배경·골드 배지, 체크 아이콘은 두지 않는다
import { formatWon, type PaywallPlan } from '../_model/paywall-plans';

interface PlanCardProps {
  plan: PaywallPlan;
  selected: boolean;
  onSelect: (plan: PaywallPlan) => void;
}

// 골드 그라데이션 — PREMIUM 배지와 같은 색으로, 화면에서 '프리미엄'을 뜻하는 색은 이것 하나다
export const GOLD_GRADIENT = 'linear-gradient(90deg, #e0a63a, #f7cf5c)';

export const PlanCard = ({ plan, selected, onSelect }: PlanCardProps) => (
  <button
    type="button"
    // 카드 안 글자가 많아 이름을 따로 준다 — 연간 배지의 "월간보다" 같은 문구와 섞이지 않게
    aria-label={`${plan.title} 플랜`}
    aria-pressed={selected}
    onClick={() => onSelect(plan)}
    // 선택 테두리 2px은 안쪽 그림자로 채워 1px 카드와 크기가 같게 유지한다
    className={`relative flex flex-1 flex-col items-start gap-0.5 rounded-2xl border p-3.5 text-left transition-colors ${
      selected
        ? 'border-primary bg-[#fffcf8] shadow-[inset_0_0_0_1px_var(--color-primary)]'
        : 'border-border bg-card'
    }`}
  >
    {/* 배지는 두 카드 모두 위 테두리에 걸친다. 고른 카드만 골드로 켜져 선택이 배지까지 따라온다 */}
    <span
      className={`absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-[3px] text-[11px] leading-[1.3] font-bold whitespace-nowrap transition-colors ${
        selected
          ? 'text-[#4a2f00] shadow-[0_2px_6px_rgba(74,46,0,0.18)]'
          : 'bg-[#f0f0ee] text-muted-foreground'
      }`}
      style={selected ? { background: GOLD_GRADIENT } : undefined}
    >
      {plan.badge}
    </span>

    <span
      className={`text-[14px] leading-[1.2] font-bold ${selected ? 'text-[#c4601f]' : 'text-foreground'}`}
    >
      {plan.title}
    </span>
    <span className="text-[12px] leading-[1.3] text-muted-foreground line-through">
      월 {formatWon(plan.monthlyListPrice)}
    </span>
    <span className="text-[22px] leading-[1.2] font-bold text-foreground">
      월 {formatWon(plan.monthlyPrice)}
    </span>
    <span
      className={`text-[11px] leading-[1.3] ${selected ? 'text-[#c4601f]' : 'text-muted-foreground'}`}
    >
      {plan.subtitle}
    </span>
  </button>
);
