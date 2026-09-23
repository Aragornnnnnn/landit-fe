'use client';

// 페이월을 닫을 때 뜨는 한시 할인 시트 — 남은 시간, 할인 연간과 정가 월간, 결제 CTA.
// 홈 헤더 배지에서도 같은 시트를 연다
import { useEffect, useState } from 'react';
import { EVENTS, type SubscriptionPlan } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import type { PaywallPromo } from '../api/subscription';
import type { OfferingTiers } from '../model/offerings';
import { formatWon } from '../model/plans';
import { buildPromoSheet } from '../model/promo-sheet';
import { usePurchase } from '../model/usePurchase';
import { GOLD_GRADIENT, PremiumPill } from './premium-brand';
import { PromoClock } from './PromoClock';
import { PromoGlow } from './PromoGlow';

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
  const newUser = promo.newUser;
  // 결제는 고른 카드가 가리키는 패키지로 간다 — 연간은 할인, 월간은 정가
  const { busy, purchase } = usePurchase({
    pricing: { yearly: tiers.promo.yearly, monthly: tiers.list.monthly },
    onUnlocked,
    promo: true,
  });

  // 5분이 지나면 스스로 닫는다 — 끝난 할인을 띄워 두지 않는다. 결제 중이면 결과를 받을 때까지 남는다
  useEffect(() => {
    if (expired && !busy) onClose();
  }, [expired, busy, onClose]);

  // 본 횟수는 여기서 낸다 — 실제로 그려지는 유일한 자리라 화면과 어긋날 수 없다.
  // 부르는 쪽에서 내면 "열려고 했지만 못 그린" 경우까지 세어 전환율 분모가 부푼다
  const shown = sheet !== null;
  useEffect(() => {
    if (!shown) return;
    track(EVENTS.PROMO_SHEET_VIEWED, { new_user: newUser });
  }, [shown, newUser]);

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
    ? `${yearly.discountRate}% 할인 받고 시작하기`
    : `월 ${formatWon(monthly.price)}으로 시작하기`;

  const selectPlan = (plan: SubscriptionPlan) => {
    if (plan === selectedPlan) return;
    setSelectedPlan(plan);
    track(EVENTS.PAYWALL_PLAN_SELECTED, { plan, promo: true });
  };

  const startPurchase = () => {
    track(EVENTS.PURCHASE_STARTED, { plan: selectedPlan, promo: true });
    void purchase(selectedPlan);
  };

  return (
    <BottomSheet open onClose={closeIfIdle}>
      <PromoGlow />

      {/* 딤을 눌러 닫을 수 있지만 눈에 보이는 길도 둔다. 결제 중에는 여기도 잠긴다 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={closeIfIdle}
        className="absolute top-4 right-4 text-muted-foreground"
      >
        <CloseIcon size={24} />
      </button>

      <header className="relative flex flex-col items-center text-center">
        <PremiumPill />
        <h2 className="mt-2.5 text-[26px] leading-[1.3] font-bold text-foreground">
          지금 화면에서만
          <br />
          구독 <span className="text-[30px]">{yearly.discountRate}%</span> 할인
        </h2>
        {/* 금색은 맨 위 PREMIUM과 할인율 배지 둘만 — 남은 시간은 배경 없이 빨간 글자로 */}
        <p className="mt-2.5 flex items-center gap-1 text-[15px] leading-[1.3] font-bold text-destructive">
          <PromoClock seconds={promo.remainingSeconds} /> 후 종료
        </p>
      </header>

      <section className="relative mt-5 flex flex-col gap-2.5">
        <PlanRow
          title="연간 플랜"
          selected={isYearly}
          onSelect={() => selectPlan('yearly')}
          badge={`${yearly.discountRate}% 할인`}
          trial="7일 무료 체험 포함"
          price={`${formatWon(yearly.monthlyPrice)} /월`}
          yearPrice={`${formatWon(yearly.price)} /년`}
          yearListPrice={formatWon(monthly.yearlyEquivalent)}
        />
        <PlanRow
          title="월간 플랜"
          selected={!isYearly}
          onSelect={() => selectPlan('monthly')}
          badge={null}
          trial={null}
          price={`${formatWon(monthly.price)} /월`}
          yearPrice={`${formatWon(monthly.yearlyEquivalent)} /년`}
          yearListPrice={null}
        />
      </section>

      <footer className="relative mt-6">
        {/* 높이만 한 단계 낮춘다 — 글자는 큰 버튼 그대로 둬야 눌러야 할 것으로 읽힌다 */}
        <Button
          size="md"
          className="text-base font-bold"
          onClick={startPurchase}
          loading={busy}
        >
          {ctaLabel}
        </Button>
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
  /** 무료 체험 포함 여부. 없는 플랜은 null이라 줄이 비지 않는다 */
  trial: string | null;
  /** 큰 숫자 — 월 기준 금액. 아래 1년치와 단위 표기를 맞춰 눈이 단위만 견주게 한다 */
  price: string;
  /** 1년치 금액. 두 카드를 같은 자로 재야 얼마나 싼지 읽힌다 */
  yearPrice: string;
  /** 지워서 보여줄 비교선 — 월간으로 1년 쓸 때의 금액. 비교가 필요 없는 카드는 null */
  yearListPrice: string | null;
}

const PlanRow = ({
  title,
  selected,
  onSelect,
  badge,
  trial,
  price,
  yearPrice,
  yearListPrice,
}: PlanRowProps) => (
  <button
    type="button"
    aria-label={title}
    aria-pressed={selected}
    onClick={onSelect}
    // 선택은 테두리와 바탕색만으로 말한다 — 페이월 카드와 같은 문법이라 체크 표시를 두지 않는다
    className={`relative flex items-center justify-between rounded-2xl px-4 py-4 text-left ${
      selected
        ? 'border-2 border-primary bg-[#fffcf8]'
        : 'border border-border bg-card'
    }`}
  >
    {badge && (
      <span
        className="absolute -top-2.5 right-4 rounded-full px-2.5 py-[3px] text-[11px] leading-[1.3] font-bold text-[#4a2f00]"
        style={{ background: GOLD_GRADIENT }}
      >
        {badge}
      </span>
    )}
    <span className="flex flex-col gap-0.5">
      <span className="text-[17px] leading-[1.3] font-bold text-foreground">
        {title}
      </span>
      <span
        className={`text-[12px] leading-[1.3] ${
          trial ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {trial ?? '무료 체험 미포함'}
      </span>
    </span>
    <span className="flex flex-col items-end gap-0.5">
      <span className="text-[19px] leading-[1.3] font-bold text-foreground">
        {price}
      </span>
      <span className="flex items-center gap-1.5 text-[12px] leading-[1.3] text-muted-foreground">
        {yearListPrice && (
          <span className="text-[#9ca3af] line-through">{yearListPrice}</span>
        )}
        {yearPrice}
      </span>
    </span>
  </button>
);
