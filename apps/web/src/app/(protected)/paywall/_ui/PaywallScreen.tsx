'use client';

// 프리미엄 페이월 화면 — 히어로·혜택·플랜 선택·CTA를 한 화면(스크롤 없음)에 담는다.
// 결제·복원은 features/subscription의 usePurchase가 지휘하고, 여기서는 어느 플랜을 골랐는지와 버튼 상태만 안다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { packageIdFor } from '@/features/subscription/model/offerings';
import { useOfferings } from '@/features/subscription/model/useOfferings';
import { usePurchase } from '@/features/subscription/model/usePurchase';
import { track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { Button } from '@/shared/ui/Button';

import { getBillingNotice, getCtaLabel } from '../_model/paywall-copy';
import {
  buildPaywallPlans,
  DEFAULT_PLAN_ID,
  toPlanPrices,
  type PaywallPlan,
  type PlanId,
} from '../_model/paywall-plans';
import { BenefitList } from './BenefitList';
import { PaywallHero } from './PaywallHero';
import { PlanCard } from './PlanCard';

export const PaywallScreen = () => {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<PlanId>(DEFAULT_PLAN_ID);

  // 셸이 스토어 가격을 주면 카드 숫자를 그 값으로 다시 만든다 — 못 받으면 등록값 그대로
  const pricing = useOfferings();
  const plans = buildPaywallPlans(toPlanPrices(pricing));
  const selectedPlan = plans.find((plan) => plan.id === selectedId) ?? plans[1];

  // 닫으면 홈으로 — 학습 진입에서 밀려 올라온 화면이라 온 곳으로 되돌리면 다시 페이월에 걸린다 (docs/subscription.md)
  const close = () => router.replace(homePath());
  const { phase, purchase, restore } = usePurchase({ onUnlocked: close });
  const busy = phase !== 'idle';

  const selectPlan = (plan: PaywallPlan) => {
    if (plan.id === selectedId) return;
    setSelectedId(plan.id);
    track(EVENTS.PAYWALL_PLAN_SELECTED, { plan: plan.id });
  };

  const startPurchase = () => {
    track(EVENTS.PURCHASE_STARTED, { plan: selectedId });
    void purchase(selectedId, packageIdFor(selectedId, pricing));
  };

  const startRestore = () => {
    track(EVENTS.PURCHASE_RESTORE_TAPPED);
    void restore();
  };

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background">
      <PaywallHero
        onClose={close}
        onRestore={startRestore}
        restoreDisabled={busy}
      />

      <BenefitList />

      {/* 남는 높이는 여기로 — 큰 폰에선 숨을 쉬고 작은 폰에선 0이 된다 */}
      <div className="min-h-0 flex-1" />

      <section className="flex gap-2.5 px-5 pt-[22px] short:pt-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedId}
            onSelect={selectPlan}
          />
        ))}
      </section>

      <footer className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] short:pb-[max(env(safe-area-inset-bottom),8px)]">
        <Button onClick={startPurchase} loading={busy}>
          {getCtaLabel(selectedPlan)}
        </Button>
        <p className="mt-3.5 text-center text-[11px] leading-[1.35] text-muted-foreground short:mt-2">
          {getBillingNotice(selectedPlan)}
        </p>
        <nav className="mt-3 flex justify-center gap-3 text-[10px] leading-[1.3] font-medium text-muted-foreground underline short:mt-2">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
        </nav>
      </footer>
    </main>
  );
};
