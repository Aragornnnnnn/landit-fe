'use client';

// 프리미엄 페이월 화면 — 히어로·혜택·플랜 선택·CTA를 한 화면(스크롤 없음)에 담는다.
// 결제·복원은 features/subscription의 usePurchase가 지휘하고, 여기서는 어느 플랜을 골랐는지와 버튼 상태만 안다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  dismissPaywall,
  type PaywallPromo,
} from '@/features/subscription/api/subscription';
import { toKrwPrices } from '@/features/subscription/model/offerings';
import {
  buildPaywallPlans,
  DEFAULT_PLAN_ID,
  PLAN_ORDER,
  type PaywallPlan,
  type PlanId,
} from '@/features/subscription/model/plans';
import { useOfferings } from '@/features/subscription/model/useOfferings';
import { usePromoOffer } from '@/features/subscription/model/usePromoOffer';
import { usePurchase } from '@/features/subscription/model/usePurchase';
import { BenefitComparison } from '@/features/subscription/ui/BenefitComparison';
import { PromoSheet } from '@/features/subscription/ui/PromoSheet';
import { track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { Button } from '@/shared/ui/Button';

import {
  getBillingNotice,
  getCancelNotice,
  getCtaLabel,
} from '../_model/paywall-copy';
import { PaywallHero } from './PaywallHero';
import { PlanCard } from './PlanCard';

interface PaywallScreenProps {
  /** 결제·복원이 끝난 뒤 돌아갈 내부 경로. 학습 진입에서 막혀 왔을 때만 있고, 없으면 홈으로 간다 */
  returnTo?: string;
}

export const PaywallScreen = ({ returnTo }: PaywallScreenProps) => {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<PlanId>(DEFAULT_PLAN_ID);

  // 셸이 스토어 가격을 주면 카드 숫자를 그 값으로 다시 만든다 — 못 받으면 등록값 그대로.
  // 본 화면은 늘 정가다. 할인은 닫을 때 뜨는 시트에만 있다
  const tiers = useOfferings();
  const { list: pricing } = tiers;
  // 닫을 때 서버가 준 할인(원본)과, 남은 시간이 반영된 값. 만료되면 live가 null이 된다
  const [granted, setGranted] = useState<PaywallPromo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // 서버에 알리는 동안 닫기를 잠근다 — 연타하면 요청이 쌓이고 화면은 그대로다
  const [closing, setClosing] = useState(false);
  const live = usePromoOffer(granted);
  const plans = buildPaywallPlans(toKrwPrices(pricing));
  const selectedPlan = plans[selectedId];

  const goHome = () => router.replace(homePath());
  // 닫으면 서버에 알리고, 할인을 받으면 시트로 붙잡는다. 자격이 없거나 할인 패키지가 없으면 그대로 홈으로 —
  // 학습 진입에서 밀려 올라온 화면이라 온 곳으로 되돌리면 다시 페이월에 걸린다 (docs/subscription.md)
  const close = async () => {
    if (sheetOpen || closing) return;
    // 이미 받아 둔 할인이 있으면 다시 알리지 않는다. 시트를 닫았다가 다시 닫기를 누른 경우다
    if (granted) {
      setSheetOpen(true);
      return;
    }
    setClosing(true);
    // 기록에 실패해도 닫히는 것을 막지 않는다. 할인을 못 받을 뿐이다
    const result = await dismissPaywall().catch(() => null);
    setClosing(false);
    if (result?.promo && tiers.promo.yearly) {
      setGranted(result.promo);
      setSheetOpen(true);
      track(EVENTS.PROMO_SHEET_VIEWED, {
        promo_campaign: result.promo.campaignKey,
      });
      return;
    }
    goHome();
  };
  // 유료가 되면 원래 가려던 곳으로 — 게이트가 붙인 ?from=. 캐시가 이미 유료라 다시 막히지 않는다
  const unlock = () => router.replace(returnTo ?? homePath());
  const { busy, purchase, restore } = usePurchase({
    pricing,
    onUnlocked: unlock,
  });

  const selectPlan = (plan: PaywallPlan) => {
    if (plan.id === selectedId) return;
    setSelectedId(plan.id);
    track(EVENTS.PAYWALL_PLAN_SELECTED, { plan: plan.id });
  };

  const startPurchase = () => {
    track(EVENTS.PURCHASE_STARTED, { plan: selectedId });
    void purchase(selectedId);
  };

  const startRestore = () => {
    track(EVENTS.PURCHASE_RESTORE_TAPPED);
    void restore();
  };

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background">
      <PaywallHero
        onClose={() => void close()}
        onRestore={startRestore}
        restoreDisabled={busy}
      />

      <BenefitComparison />

      {/* 남는 높이는 여기로 — 큰 폰에선 숨을 쉬고 작은 폰에선 0이 된다 */}
      <div className="min-h-0 flex-1" />

      <section className="flex gap-2.5 px-5 pt-[22px] short:pt-2">
        {PLAN_ORDER.map((id) => (
          <PlanCard
            key={id}
            plan={plans[id]}
            selected={id === selectedId}
            onSelect={selectPlan}
          />
        ))}
      </section>

      {/* 만료돼도 시트를 걷지 않는다 — 결제 시트가 떠 있는 동안 5분이 지나도 결과를 받아야 한다 */}
      {sheetOpen && granted && (
        <PromoSheet
          open
          promo={live ?? { ...granted, remainingSeconds: 0 }}
          expired={live === null}
          tiers={tiers}
          onClose={goHome}
          onUnlocked={unlock}
        />
      )}

      <footer className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] short:pb-[max(env(safe-area-inset-bottom),8px)]">
        <Button onClick={startPurchase} loading={busy}>
          {getCtaLabel(selectedPlan)}
        </Button>
        <p className="mt-3.5 text-center text-[11px] leading-[1.35] text-muted-foreground short:mt-2">
          {getBillingNotice(selectedPlan)}
        </p>
        <p className="mt-1 text-center text-[11px] leading-[1.35] text-muted-foreground">
          {getCancelNotice(selectedPlan)}
        </p>
        <nav className="mt-3 flex justify-center gap-3 text-[10px] leading-[1.3] font-medium text-muted-foreground underline short:mt-2">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
        </nav>
      </footer>
    </main>
  );
};
