'use client';

// 페이월을 닫을 때 뜨는 한시 할인 시트 — 남은 시간, 할인 연간과 정가 월간, 결제 CTA.
// 홈 헤더 배지에서도 같은 시트를 연다
import { useState } from 'react';
import { EVENTS, type SubscriptionPlan } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import type { PaywallPromo } from '../api/subscription';
import type { OfferingTiers } from '../model/offerings';
import { formatWon } from '../model/plans';
import { buildPromoSheet } from '../model/promo-sheet';
import { usePurchase } from '../model/usePurchase';
import { GOLD_GRADIENT, PremiumPill } from './premium-brand';

interface PromoSheetProps {
  open: boolean;
  /** 남은 시간이 반영된 할인. 끝나면 null이 와 시트가 닫힌다 */
  promo: PaywallPromo | null;
  tiers: OfferingTiers;
  onClose: () => void;
  /** 유료가 되면 — 보통 시트를 닫고 원래 가려던 곳으로 보낸다 */
  onUnlocked: () => void;
}

/** 165초 → "02:45" */
const formatClock = (seconds: number) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

export const PromoSheet = ({
  open,
  promo,
  tiers,
  onClose,
  onUnlocked,
}: PromoSheetProps) => {
  const [selected, setSelected] = useState<SubscriptionPlan>('yearly');
  const sheet = buildPromoSheet(tiers);
  // 결제는 고른 카드가 가리키는 패키지로 간다 — 연간은 할인, 월간은 정가
  const { busy, purchase } = usePurchase({
    pricing: { yearly: tiers.promo.yearly, monthly: tiers.list.monthly },
    onUnlocked,
    promoCampaign: promo?.campaignKey,
  });

  // 할인 패키지를 못 받았으면 시트 자체를 열지 않는다. 할인가를 보여 놓고 정가로 결제되는 일이 없어야 한다
  if (!sheet || !promo) return null;

  const { yearly, monthly } = sheet;
  const discountLabel = yearly.discountRate ? `${yearly.discountRate}% ` : '';

  const selectPlan = (plan: SubscriptionPlan) => {
    if (plan === selected) return;
    setSelected(plan);
    track(EVENTS.PAYWALL_PLAN_SELECTED, {
      plan,
      promo_campaign: promo.campaignKey,
    });
  };

  const startPurchase = () => {
    track(EVENTS.PURCHASE_STARTED, {
      plan: selected,
      promo_campaign: promo.campaignKey,
    });
    void purchase(selected);
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <header className="text-center">
        <PremiumPill />
        <h2 className="mt-3 text-[22px] leading-[1.35] font-bold text-foreground">
          {promo.newUser ? '첫 방문 특별 혜택' : '지금만 특별 혜택'}
          <br />
          연간 {discountLabel}할인
        </h2>
        <p
          className="mt-3 inline-block rounded-full px-4 py-1.5 text-[15px] font-bold text-[#4a2f00] tabular-nums"
          style={{ background: GOLD_GRADIENT }}
        >
          {formatClock(promo.remainingSeconds)} 후 종료
        </p>
      </header>

      <section className="mt-5 flex flex-col gap-2.5">
        <PlanRow
          title="연간 플랜"
          selected={selected === 'yearly'}
          onSelect={() => selectPlan('yearly')}
          badge={yearly.discountRate ? `${yearly.discountRate}% 할인` : null}
          price={`월 ${formatWon(yearly.monthlyPrice)}`}
          listPrice={
            yearly.monthlyListPrice
              ? `월 ${formatWon(yearly.monthlyListPrice)}`
              : null
          }
          note={`연 ${formatWon(yearly.price)} · 7일 무료 체험`}
        />
        <PlanRow
          title="월간 플랜"
          selected={selected === 'monthly'}
          onSelect={() => selectPlan('monthly')}
          badge={null}
          price={`월 ${formatWon(monthly.price)}`}
          listPrice={null}
          note="매달 결제 · 언제든 해지"
        />
      </section>

      <footer className="mt-6">
        <Button onClick={startPurchase} loading={busy}>
          {discountLabel}할인 받고 시작하기
        </Button>
        <p className="mt-3 text-center text-[11px] leading-[1.35] text-muted-foreground">
          {selected === 'yearly'
            ? `7일 무료 체험 후 연 ${formatWon(yearly.price)} 정기 결제 · 언제든 해지 가능`
            : `매월 ${formatWon(monthly.price)} 정기 결제 · 언제든 해지 가능`}
        </p>
      </footer>
    </BottomSheet>
  );
};

interface PlanRowProps {
  title: string;
  selected: boolean;
  onSelect: () => void;
  badge: string | null;
  price: string;
  listPrice: string | null;
  note: string;
}

const PlanRow = ({
  title,
  selected,
  onSelect,
  badge,
  price,
  listPrice,
  note,
}: PlanRowProps) => (
  <button
    type="button"
    aria-label={title}
    aria-pressed={selected}
    onClick={onSelect}
    className={`relative flex items-center justify-between rounded-2xl border bg-card px-4 py-3.5 text-left ${
      selected ? 'border-2 border-primary' : 'border-border'
    }`}
  >
    {badge && (
      <span
        className="absolute -top-2.5 left-4 rounded-full px-2.5 py-[3px] text-[11px] leading-[1.3] font-bold text-[#4a2f00]"
        style={{ background: GOLD_GRADIENT }}
      >
        {badge}
      </span>
    )}
    <span className="flex flex-col">
      <span className="text-[15px] font-bold text-foreground">{title}</span>
      <span className="text-[12px] text-muted-foreground">{note}</span>
    </span>
    <span className="flex flex-col items-end">
      <span className="text-[17px] font-bold text-foreground">{price}</span>
      {listPrice && (
        <span className="text-[12px] text-muted-foreground line-through">
          {listPrice}
        </span>
      )}
    </span>
  </button>
);
