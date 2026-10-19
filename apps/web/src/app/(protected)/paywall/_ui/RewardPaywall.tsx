'use client';

// 환급 챌린지 페이월 — 혜택 화면에서 「100일 프리미엄 시작하기」를 누르면 결제 금액 안내로 넘어가고, 거기서 결제한다.
// 결제·복원·닫기는 PaywallScreen이 지휘하고 여기서는 어느 단계인지와 버튼만 안다
import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { formatWon } from '@/features/subscription/lib/won';
import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';

import { REWARD_PLAN_ID, type RewardPlan } from '../_model/paywall-content';
import { BenefitsStep } from './BenefitsStep';
import { CheckoutStep } from './CheckoutStep';
import { PaywallHeader } from './PaywallHeader';

type Step = 'benefits' | 'checkout';

export const RewardPaywall = ({
  plan,
  busy,
  onClose,
  onRestore,
  onPurchase,
}: {
  plan: RewardPlan;
  /** 결제·복원이 진행 중이면 버튼을 잠근다 */
  busy: boolean;
  onClose: () => void;
  onRestore: () => void;
  onPurchase: () => void;
}) => {
  const [step, setStep] = useState<Step>('benefits');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 단계가 바뀌면 맨 위부터 보여 준다 — 혜택 화면 맨 아래에서 넘어와도 결제 금액 안내의 가격이 먼저 보이게
  const goTo = (next: Step) => {
    setStep(next);
    scrollRef.current?.scrollTo({ top: 0 });
    if (next === 'checkout') {
      track(EVENTS.PAYWALL_CHECKOUT_VIEWED, { plan: REWARD_PLAN_ID });
    }
  };

  return (
    <main className="relative mx-auto h-dvh max-w-[430px] overflow-hidden bg-background">
      {/* 아래 여백은 하단 고정 CTA 높이만큼 — 마지막 내용이 버튼 뒤에 깔리지 않게 */}
      <div
        ref={scrollRef}
        data-scroll-root
        className="relative h-full overflow-y-auto pb-[calc(max(var(--safe-area-inset-bottom),12px)+100px)]"
      >
        {step === 'benefits' ? (
          <>
            <PaywallHeader
              onClose={onClose}
              onRestore={onRestore}
              restoreDisabled={busy}
            />
            <BenefitsStep plan={plan} />
          </>
        ) : (
          <CheckoutStep plan={plan} onBack={() => goTo('benefits')} />
        )}
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(to_bottom,transparent,var(--color-background)_28px)] px-5 pt-9 pb-[max(var(--safe-area-inset-bottom),12px)]">
        {step === 'benefits' ? (
          <Button onClick={() => goTo('checkout')}>
            {plan.days}일 프리미엄 시작하기
          </Button>
        ) : (
          <Button onClick={onPurchase} loading={busy}>
            {formatWon(plan.price)}으로 프리미엄 시작하기
          </Button>
        )}
      </footer>
    </main>
  );
};
