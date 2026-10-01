'use client';

// 프리미엄 페이월 화면 — 히어로·혜택·플랜 선택·CTA를 한 화면(스크롤 없음)에 담는다.
// 결제·복원은 features/subscription의 usePurchase가 지휘하고, 여기서는 어느 플랜을 골랐는지와 버튼 상태만 안다
import { useState } from 'react';
import { EVENTS, type SubscriptionPlan } from '@landit/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { usePaywallDismiss } from '@/features/subscription/model/exit-promo/usePaywallDismiss';
import { toKrwPrices } from '@/features/subscription/model/product/offering';
import {
  buildPaywallPlans,
  DEFAULT_PLAN_ID,
  PLAN_ORDER,
  type PaywallPlan,
} from '@/features/subscription/model/product/plans';
import { useOffering } from '@/features/subscription/model/product/useOffering';
import { usePurchase } from '@/features/subscription/model/purchase/usePurchase';
import { BenefitComparison } from '@/features/subscription/ui/product/BenefitComparison';
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
  const [selectedId, setSelectedId] =
    useState<SubscriptionPlan>(DEFAULT_PLAN_ID);

  // 셸이 스토어 가격을 주면 카드 숫자를 그 값으로 다시 만든다 — 못 받으면 등록값 그대로.
  // 본 화면은 늘 정가다. 할인은 닫을 때 뜨는 시트에만 있다
  const offering = useOffering();
  const packages = offering.regular;
  // 서버에 알리는 동안 닫기를 잠근다 — 연타하면 요청이 쌓이고 화면은 그대로다
  const [closing, setClosing] = useState(false);
  const plans = buildPaywallPlans(toKrwPrices(packages));
  const selectedPlan = plans[selectedId];

  const goHome = () => router.replace(homePath());
  const dismiss = usePaywallDismiss(offering);
  // 닫으면 서버에 알린 뒤 홈으로 — 할인을 받았으면 시트는 홈에서 뜬다.
  // 학습 진입에서 밀려 올라온 화면이라 온 곳으로 되돌리면 다시 페이월에 걸린다 (docs/subscription.md)
  const close = async () => {
    if (closing) return;
    setClosing(true);
    await dismiss();
    setClosing(false);
    goHome();
  };

  // 유료가 되면 원래 가려던 곳으로 — 게이트가 붙인 ?from=. 캐시가 이미 유료라 다시 막히지 않는다
  const unlock = () => router.replace(returnTo ?? homePath());
  const { busy, purchase, restore } = usePurchase({
    packages,
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

      <footer className="px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),24px)] short:pb-[max(var(--safe-area-inset-bottom),8px)]">
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
