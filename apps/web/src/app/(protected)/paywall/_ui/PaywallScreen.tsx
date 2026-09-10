'use client';

// 프리미엄 페이월 화면 — 히어로·혜택·플랜 선택·CTA를 한 화면(스크롤 없음)에 담는다.
// 결제 자체는 requestPurchase에 맡기고 여기서는 어느 플랜을 골랐는지만 안다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BenefitList } from '@/features/subscription/ui/BenefitList';
import { track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { Button } from '@/shared/ui/Button';

import { getBillingNotice, getCtaLabel } from '../_model/paywall-copy';
import {
  DEFAULT_PLAN_ID,
  PAYWALL_PLANS,
  type PaywallPlan,
  type PlanId,
} from '../_model/paywall-plans';
import { requestPurchase, requestRestore } from '../_model/request-purchase';
import { PaywallHero } from './PaywallHero';
import { PlanCard } from './PlanCard';

export const PaywallScreen = () => {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<PlanId>(DEFAULT_PLAN_ID);

  const selectPlan = (plan: PaywallPlan) => {
    if (plan.id === selectedId) return;
    setSelectedId(plan.id);
    track(EVENTS.PAYWALL_PLAN_SELECTED, { plan: plan.id });
  };

  const startPurchase = () => {
    track(EVENTS.PURCHASE_STARTED, { plan: selectedId });
    requestPurchase(selectedId);
  };

  const restore = () => {
    track(EVENTS.PURCHASE_RESTORE_TAPPED);
    requestRestore();
  };

  // 닫으면 홈으로 — 학습 진입에서 밀려 올라온 화면이라 온 곳으로 되돌리면 다시 페이월에 걸린다 (docs/subscription.md)
  const close = () => router.replace(homePath());

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background">
      <PaywallHero onClose={close} />

      <BenefitList />

      {/* 남는 높이는 여기로 — 큰 폰에선 숨을 쉬고 작은 폰에선 0이 된다 */}
      <div className="min-h-0 flex-1" />

      <section className="flex gap-2.5 px-5 pt-[22px] short:pt-3">
        {PAYWALL_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedId}
            onSelect={selectPlan}
          />
        ))}
      </section>

      <footer className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] short:pb-[max(env(safe-area-inset-bottom),8px)]">
        <Button onClick={startPurchase}>{getCtaLabel(selectedId)}</Button>
        <p className="mt-3.5 text-center text-[11px] leading-[1.35] text-muted-foreground short:mt-2">
          {getBillingNotice(selectedId)}
        </p>
        <nav className="mt-3 flex justify-center gap-3 text-[10px] leading-[1.3] font-medium text-muted-foreground underline short:mt-2">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
          {/* 스토어 심사가 요구하는 구매 복원 진입점. 동작은 결제 연동(LAN-447)에서 붙는다 */}
          <button type="button" onClick={restore} className="underline">
            구매 복원
          </button>
        </nav>
      </footer>
    </main>
  );
};
