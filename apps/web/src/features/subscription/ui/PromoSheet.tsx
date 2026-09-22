'use client';

// 페이월을 닫을 때 뜨는 한시 할인 시트 — 남은 시간, 할인 연간과 정가 월간, 결제 CTA.
// 홈 헤더 배지에서도 같은 시트를 연다
import { useEffect, useState } from 'react';
import { EVENTS, type SubscriptionPlan } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import type { PaywallPromo } from '../api/subscription';
import type { OfferingTiers } from '../model/offerings';
import { formatWon } from '../model/plans';
import { formatPromoClock } from '../model/promo-clock';
import { buildPromoSheet } from '../model/promo-sheet';
import { usePurchase } from '../model/usePurchase';
import { GOLD_GRADIENT, PremiumPill } from './premium-brand';

interface PromoSheetProps {
  /** 화면에 적을 할인. 끝났으면 남은 시간이 0으로 온다 */
  promo: PaywallPromo;
  /** 5분이 지났는가. 지났으면 더 팔지 않고 닫을 길만 남긴다 */
  expired: boolean;
  tiers: OfferingTiers;
  onClose: () => void;
  /** 유료가 되면 — 보통 시트를 닫고 원래 가려던 곳으로 보낸다 */
  onUnlocked: () => void;
}

/**
 * 한시 할인 바텀시트.
 *
 * 5분이 지나면 스스로 닫힌다. 단 결제가 진행 중이면 남는다 — 스토어 결제 시트를 띄운 채
 * 만료되는 일이 흔한데, 여기서 걷히면 이미 나간 결제의 결과를 받을 곳이 사라진다.
 */
export const PromoSheet = ({
  promo,
  expired,
  tiers,
  onClose,
  onUnlocked,
}: PromoSheetProps) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');
  const sheet = buildPromoSheet(tiers);
  // 결제는 고른 카드가 가리키는 패키지로 간다 — 연간은 할인, 월간은 정가
  const { busy, purchase } = usePurchase({
    pricing: { yearly: tiers.promo.yearly, monthly: tiers.list.monthly },
    onUnlocked,
    promoCampaign: promo.campaignKey,
  });

  // 5분이 지나면 스스로 닫는다 — 끝난 할인을 띄워 두지 않는다. 결제 중이면 결과를 받을 때까지 남는다
  useEffect(() => {
    if (expired && !busy) onClose();
  }, [expired, busy, onClose]);

  // 할인 패키지를 못 받았으면 시트를 열지 않는다. 할인가를 보여 놓고 정가로 결제되는 일이 없어야 한다
  if (!sheet) return null;

  // 결제 시트가 떠 있는 동안에는 닫히지 않는다 — 여기서 걷히면 스토어 결제 결과를 받을 곳이 사라진다
  const closeIfIdle = () => {
    if (!busy) onClose();
  };

  const { yearly, monthly } = sheet;
  const isYearly = selectedPlan === 'yearly';
  // 할인은 연간에만 있다 — 월간을 고른 채 "할인 받고 시작하기"를 띄우면 거짓말이 된다.
  // 월간 문구는 페이월 CTA와 같은 말을 쓴다
  const ctaLabel = isYearly
    ? `${yearly.discountRate ? `${yearly.discountRate}% ` : ''}할인 받고 시작하기`
    : `월 ${formatWon(monthly.price)}으로 시작하기`;

  const selectPlan = (plan: SubscriptionPlan) => {
    if (plan === selectedPlan) return;
    setSelectedPlan(plan);
    track(EVENTS.PAYWALL_PLAN_SELECTED, {
      plan,
      promo_campaign: promo.campaignKey,
    });
  };

  const startPurchase = () => {
    track(EVENTS.PURCHASE_STARTED, {
      plan: selectedPlan,
      promo_campaign: promo.campaignKey,
    });
    void purchase(selectedPlan);
  };

  return (
    <BottomSheet open onClose={closeIfIdle}>
      <header className="text-center">
        <PremiumPill />
        {promo.newUser && (
          <p className="mt-2.5 text-[12px] leading-[1.3] font-medium text-muted-foreground">
            신규 유저 혜택
          </p>
        )}
        <h2 className="mt-2.5 text-[22px] leading-[1.35] font-bold text-foreground">
          지금 화면에서만
          <br />
          구독 {yearly.discountRate ? `${yearly.discountRate}% ` : ''}할인
        </h2>
        {/* 금색은 맨 위 PREMIUM과 할인율 배지 둘만 — 남은 시간은 배경 없이 빨간 글자로 */}
        <p className="mt-2.5 text-[15px] leading-[1.3] font-bold text-destructive tabular-nums">
          {formatPromoClock(promo.remainingSeconds)} 후 종료
        </p>
      </header>

      <section className="mt-5 flex flex-col gap-2.5">
        <PlanRow
          title="연간 플랜"
          selected={isYearly}
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
          selected={!isYearly}
          onSelect={() => selectPlan('monthly')}
          badge={null}
          price={`월 ${formatWon(monthly.price)}`}
          listPrice={null}
          note="매달 결제 · 언제든 해지"
        />
      </section>

      <footer className="mt-6">
        <Button onClick={startPurchase} loading={busy}>
          {ctaLabel}
        </Button>
        {/* 결제할 수 있는 화면이라 자동 갱신 금액과 해지 방법을 여기서도 밝힌다 (스토어 심사 항목) */}
        <p className="mt-3 text-center text-[11px] leading-[1.35] text-muted-foreground">
          {isYearly
            ? `7일 무료 체험 후 연 ${formatWon(yearly.price)} 정기 결제 · 언제든 해지 가능`
            : `매월 ${formatWon(monthly.price)} 정기 결제 · 언제든 해지 가능`}
        </p>
        <p className="mt-1 text-center text-[11px] leading-[1.35] text-muted-foreground">
          {isYearly
            ? '체험 종료 24시간 전까지 해지하면 청구되지 않아요'
            : '결제일 24시간 전까지 해지하면 다음 달은 청구되지 않아요'}
        </p>
        <nav className="mt-3 flex justify-center gap-3 text-[10px] leading-[1.3] font-medium text-muted-foreground underline">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
        </nav>
      </footer>
    </BottomSheet>
  );
};

interface PlanRowProps {
  title: string;
  selected: boolean;
  onSelect: () => void;
  /** 카드 위 테두리에 걸치는 문구. 할인을 강조하는 카드만 */
  badge: string | null;
  price: string;
  /** 지워서 보여줄 비교가. 비교할 정가가 없으면 null */
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
