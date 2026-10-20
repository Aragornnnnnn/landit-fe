'use client';

// 환급 챌린지 페이월 — 혜택 화면에서 「다음」을 누르면 결제 금액 안내로 넘어가고, 거기서 결제한다.
// 결제·복원·닫기는 PaywallScreen이 지휘하고 여기서는 어느 단계인지와 버튼만 안다
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useReducedMotion } from 'motion/react';

import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { REWARD_PLAN_ID, type RewardPlan } from '../_model/paywall-content';
import { BenefitsStep } from './BenefitsStep';
import { CheckoutStep } from './CheckoutStep';
import { PaywallHeader } from './PaywallHeader';

type Step = 'benefits' | 'checkout';

// 혜택 화면이 뜬 뒤 아래에 더 있다는 걸 알려 주는 움찔 — 이만큼 기다렸다가, 이만큼 내려갔다가, 이만큼 뒤에 돌아온다
const SCROLL_HINT_DELAY_MS = 1200;
const SCROLL_HINT_PX = 72;
const SCROLL_HINT_RETURN_MS = 500;

export const RewardPaywall = ({
  plan,
  startStep = 'benefits',
  busy,
  onClose,
  onRestore,
  onPurchase,
  preview = false,
}: {
  plan: RewardPlan;
  /** 처음 보여 줄 단계 — 혜택을 이미 본 환급 화면에서 오면 결제 금액 안내부터 */
  startStep?: Step;
  /** 결제·복원이 진행 중이면 버튼을 잠근다 */
  busy: boolean;
  onClose: () => void;
  onRestore: () => void;
  onPurchase: () => void;
  /** 개발자 묶음의 미리보기인가 — 그러면 결제 금액 안내 노출을 찍지 않아 실험 지표에 섞이지 않는다 */
  preview?: boolean;
}) => {
  const [step, setStep] = useState<Step>(startStep);
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const trackCheckoutViewed = () => {
    if (!preview)
      track(EVENTS.PAYWALL_CHECKOUT_VIEWED, { plan: REWARD_PLAN_ID });
  };

  // 단계가 바뀌면 맨 위부터 보여 준다 — 혜택 화면 맨 아래에서 넘어와도 결제 금액 안내의 가격이 먼저 보이게
  const goTo = (next: Step) => {
    setStep(next);
    setScrolled(false);
    scrollRef.current?.scrollTo({ top: 0 });
    if (next === 'checkout') trackCheckoutViewed();
  };

  // 혜택 화면이 처음 뜨면 한 번만 살짝 내려갔다 돌아온다 — 첫 화면 아래에 「프리미엄만 누리는 혜택 4가지」가 이어진다는 걸 보여 준다.
  // 그 전에 스스로 내렸거나 결제 금액 안내로 넘어갔으면 하지 않고, 동작 줄이기를 켰으면 하지 않는다
  const reduced = useReducedMotion();
  const hinted = useRef(false);
  useEffect(() => {
    if (step !== 'benefits' || reduced || hinted.current) return;
    let back: ReturnType<typeof setTimeout> | undefined;
    const hint = setTimeout(() => {
      const root = scrollRef.current;
      hinted.current = true;
      if (!root || root.scrollTop > 0) return;
      root.scrollTo({ top: SCROLL_HINT_PX, behavior: 'smooth' });
      back = setTimeout(() => {
        // 그사이 스스로 더 내렸으면 끌어올리지 않는다
        if (root.scrollTop <= SCROLL_HINT_PX)
          root.scrollTo({ top: 0, behavior: 'smooth' });
      }, SCROLL_HINT_RETURN_MS);
    }, SCROLL_HINT_DELAY_MS);
    return () => {
      clearTimeout(hint);
      clearTimeout(back);
    };
  }, [step, reduced]);

  // 결제 금액 안내부터 열었으면 그 노출도 한 번 찍는다 — 혜택 화면을 거치지 않았을 뿐 같은 단계다
  const reportOpenedAtCheckout = useEffectEvent(() => {
    if (startStep === 'checkout') trackCheckoutViewed();
  });
  useEffect(() => {
    reportOpenedAtCheckout();
  }, []);

  return (
    <main className="relative mx-auto h-dvh max-w-[430px] overflow-hidden bg-background">
      {/* 아래 여백은 하단 고정 CTA 높이만큼 — 마지막 내용이 버튼 뒤에 깔리지 않게. 혜택 화면은 혜택 판(흰색)이 끝까지 이어 보이게 여백도 흰색으로 칠한다 */}
      <div
        ref={scrollRef}
        data-scroll-root
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 48)}
        className={`relative h-full overflow-y-auto pb-[calc(max(var(--safe-area-inset-bottom),12px)+100px)] ${step === 'benefits' ? 'bg-card' : ''}`}
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
          <CheckoutStep
            plan={plan}
            // 혜택 화면을 거치지 않고 열었으면 되돌아갈 곳이 없다 — 바로 닫는다
            exit={startStep === 'checkout' ? 'close' : 'back'}
            onExit={startStep === 'checkout' ? onClose : () => goTo('benefits')}
            onRestore={onRestore}
            restoreDisabled={busy}
          />
        )}
      </div>

      {/* 떠 있는 닫기 — 혜택 화면은 길어서, 맨 위 줄이 올라간 뒤에도 언제든 닫을 수 있게 한다. 결제 금액 안내는 뒤로 버튼이 화면 안에 있다 */}
      {step === 'benefits' && scrolled && (
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-[max(var(--safe-area-inset-top),8px)] left-3 z-30 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur transition-transform active:scale-90"
        >
          <CloseIcon size={20} />
        </button>
      )}

      <footer
        className={`absolute inset-x-0 bottom-0 z-20 px-5 pt-9 pb-[max(var(--safe-area-inset-bottom),12px)] ${step === 'benefits' ? 'bg-[linear-gradient(to_bottom,transparent,var(--color-card)_28px)]' : 'bg-[linear-gradient(to_bottom,transparent,var(--color-background)_28px)]'}`}
      >
        {step === 'benefits' ? (
          <Button onClick={() => goTo('checkout')}>다음</Button>
        ) : (
          <Button onClick={onPurchase} loading={busy}>
            프리미엄 시작하기
          </Button>
        )}
      </footer>
    </main>
  );
};
