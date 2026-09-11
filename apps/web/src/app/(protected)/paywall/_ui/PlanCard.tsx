// 플랜 카드 한 장 — 누르면 선택된다. 선택 표시는 카드 사이를 스프링으로 옮겨 다니는 주황 프레임과 골드 배지, 체크 아이콘은 두지 않는다
'use client';

import { motion, useReducedMotion } from 'motion/react';

import {
  formatWon,
  type PaywallPlan,
} from '@/features/subscription/model/plans';
import { GOLD_GRADIENT } from '@/features/subscription/ui/premium-brand';
import { SPRING_SELECT } from '@/shared/motion';

interface PlanCardProps {
  plan: PaywallPlan;
  selected: boolean;
  onSelect: (plan: PaywallPlan) => void;
}

// 골드 그라데이션 — PREMIUM 배지와 같은 색으로, 화면에서 '프리미엄'을 뜻하는 색은 이것 하나다
export const PlanCard = ({ plan, selected, onSelect }: PlanCardProps) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <button
      type="button"
      // 카드 안 글자가 많아 이름을 따로 준다 — 연간 배지의 "월간보다" 같은 문구와 섞이지 않게
      aria-label={`${plan.title} 플랜`}
      aria-pressed={selected}
      onClick={() => onSelect(plan)}
      // isolate로 스택 문맥을 만들어, -z-10 프레임이 카드 배경 위·글자 아래에 깔리게 한다
      className="relative isolate flex flex-1 flex-col items-start gap-0.5 rounded-2xl border border-border bg-card p-3.5 text-left"
    >
      {/* 선택 프레임은 하나뿐이고 layoutId로 이어져, 다른 카드를 고르면 그 자리로 미끄러져 간다.
          2px 테두리는 카드 1px 테두리 바깥으로 1px 넘치게 깔아 크기 변화 없이 덮는다 */}
      {selected && (
        <motion.span
          layoutId="plan-selection"
          aria-hidden="true"
          className="absolute -inset-px -z-10 border-2 border-primary bg-[#fffcf8]"
          style={{ borderRadius: 16 }}
          transition={reduced ? { duration: 0 } : SPRING_SELECT}
        />
      )}

      {/* 배지는 할인을 강조하는 카드만 위 테두리에 걸친다. 고른 카드에서는 골드로 켜져 선택이 배지까지 따라온다.
          회색 배경은 항상 깔고 골드는 그 위에 이미지로만 얹는다 — 색 전환 중 배지가 비쳐 뒤의 테두리 선이 보이지 않게 */}
      {plan.badge && (
        <span
          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#f0f0ee] px-3 py-[3px] text-[11px] leading-[1.3] font-bold whitespace-nowrap transition-colors ${
            selected
              ? 'text-[#4a2f00] shadow-[0_2px_6px_rgba(74,46,0,0.18)]'
              : 'text-muted-foreground'
          }`}
          style={selected ? { backgroundImage: GOLD_GRADIENT } : undefined}
        >
          {plan.badge}
        </span>
      )}

      <span
        className={`text-[14px] leading-[1.2] font-bold transition-colors ${selected ? 'text-[#c4601f]' : 'text-foreground'}`}
      >
        {plan.title}
      </span>
      {/* 비교 기준이 없는 카드는 그 줄을 비워 두 카드의 큰 숫자 높이를 맞춘다 — 빈칸에 취소선이 그어지지 않게 클래스도 뗀다 */}
      <span
        className={`text-[12px] leading-[1.3] text-muted-foreground ${plan.monthlyListPrice ? 'line-through' : ''}`}
      >
        {plan.monthlyListPrice
          ? `월 ${formatWon(plan.monthlyListPrice)}`
          : '\u00a0'}
      </span>
      <span className="text-[22px] leading-[1.2] font-bold text-foreground">
        월 {formatWon(plan.monthlyPrice)}
      </span>
      <span
        className={`text-[11px] leading-[1.3] transition-colors ${selected ? 'text-[#c4601f]' : 'text-muted-foreground'}`}
      >
        {plan.subtitle}
      </span>
    </button>
  );
};
