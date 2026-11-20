// 플랜 한 줄 — 누르면 선택된다. 왼쪽에 이름과 결제 주기, 오른쪽에 실제 청구액. 선택 표시는 고른 줄에서 켜지는 주황 프레임과 골드 배지, 체크 아이콘은 두지 않는다
'use client';

import { useTranslations } from 'next-intl';

import { formatPrice } from '@/features/subscription/lib/store-price';
import { type PaywallPlan } from '@/features/subscription/model/product/plans';
import { GOLD_GRADIENT } from '@/features/subscription/ui/premium-brand';

interface PlanCardProps {
  plan: PaywallPlan;
  selected: boolean;
  onSelect: (plan: PaywallPlan) => void;
}

// 골드 그라데이션 — PREMIUM 배지와 같은 색으로, 화면에서 '프리미엄'을 뜻하는 색은 이것 하나다
export const PlanCard = ({ plan, selected, onSelect }: PlanCardProps) => {
  const t = useTranslations('paywall.planCard');
  const yearly = plan.id === 'yearly';
  const title = t('selectLabel', {
    title: t(yearly ? 'yearlyTitle' : 'monthlyTitle'),
  });
  // 작은 글씨는 결제 주기 — 연간만 월 환산가를 덧붙인다. 스토어 가격을 못 받았으면 환산가도 등록값이라 주기만 적는다
  const subtitle =
    yearly && !plan.unpriced
      ? t('yearlySubtitle', {
          price: formatPrice(plan.monthlyPrice, plan.currency),
        })
      : t(yearly ? 'yearlyCycleLabel' : 'monthlySubtitle');

  return (
    <button
      type="button"
      // 줄 안 글자가 많아 이름을 따로 준다 — 연간 배지의 "월간보다" 같은 문구와 섞이지 않게
      aria-label={title}
      aria-pressed={selected}
      onClick={() => onSelect(plan)}
      // isolate로 스택 문맥을 만들어, -z-10 프레임이 줄 배경 위·글자 아래에 깔리게 한다
      className="relative isolate flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-transform duration-150 active:scale-[0.985] motion-reduce:transition-none"
    >
      {/* 선택 프레임은 줄마다 하나씩 깔려 있고 고른 줄만 떠오른다. 세로로 떨어진 두 줄 사이를 프레임이 미끄러지면
          빈 틈을 지나가 어색해서, 떠나는 줄은 가라앉고 고른 줄은 살짝 커지며 켜지게 한다.
          2px 테두리는 줄 1px 테두리 바깥으로 1px 넘치게 깔아 크기 변화 없이 덮는다 */}
      <span
        aria-hidden="true"
        className={`absolute -inset-px -z-10 rounded-2xl border-2 border-primary bg-[#fffcf8] transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none ${
          selected ? 'scale-100 opacity-100' : 'scale-[0.985] opacity-0'
        }`}
      />

      {/* 배지는 할인을 강조하는 줄만 위 테두리 오른쪽에 걸친다. 고른 줄에서는 골드로 켜져 선택이 배지까지 따라온다.
          회색 배경은 항상 깔고 골드는 그 위에 이미지로만 얹는다 — 색 전환 중 배지가 비쳐 뒤의 테두리 선이 보이지 않게 */}
      {plan.discountRate !== undefined && !plan.unpriced && (
        <span
          className={`absolute -top-2.5 right-4 rounded-full bg-[#f0f0ee] px-2.5 py-[3px] text-11 leading-[1.3] font-bold whitespace-nowrap transition-colors ${
            selected
              ? 'text-[#4a2f00] shadow-[0_2px_6px_rgba(74,46,0,0.18)]'
              : 'text-muted-foreground'
          }`}
          style={selected ? { backgroundImage: GOLD_GRADIENT } : undefined}
        >
          {t('yearlyBadge', { rate: plan.discountRate })}
        </span>
      )}

      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={`text-16 leading-[1.3] font-bold transition-colors ${selected ? 'text-[#c4601f]' : 'text-foreground'}`}
        >
          {title}
        </span>
        <span className="text-12 leading-[1.3] text-muted-foreground">
          {subtitle}
        </span>
      </span>
      {/* 큰 숫자는 실제 청구액이다(심사 3.1.2(c)). 글자 크기 배율을 받지 않는다 — 크게 단계에서 금액이 끊기지 않게.
          스토어 가격을 못 받은 줄은 줄표만 둔다 — 등록값(원화)이 다른 통화 화면에 보이지 않게 */}
      <span className="flex shrink-0 items-baseline gap-0.5 whitespace-nowrap [--font-scale:1]">
        <span className="text-20 leading-[1.2] font-bold text-foreground">
          {plan.unpriced ? '–' : formatPrice(plan.price, plan.currency)}
        </span>
        {!plan.unpriced && (
          <span className="text-13 leading-[1.2] font-medium text-muted-foreground">
            {t(yearly ? 'yearlyUnitLabel' : 'monthlyUnitLabel')}
          </span>
        )}
      </span>
    </button>
  );
};
