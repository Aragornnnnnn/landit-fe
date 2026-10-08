'use client';

// 프리미엄 페이월 화면 — 히어로부터 학습 기능·데이터·리뷰·비교표·플랜까지 길게 스크롤하고, CTA는 하단에 고정한다.
// 결제·복원은 features/subscription의 usePurchase가 지휘하고, 여기서는 어느 플랜을 골랐는지와 버튼 상태만 안다
import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import {
  dismissPaywall,
  type MySubscription,
  type PaywallPromo,
} from '@/features/subscription/api/subscription';
import { subscriptionKeys } from '@/features/subscription/model/keys';
import { toKrwPrices } from '@/features/subscription/model/offerings';
import {
  PROMO_ENABLED,
  REFUND_CHALLENGE_ENABLED,
} from '@/features/subscription/model/payment-flag';
import {
  buildPaywallPlans,
  DEFAULT_PLAN_ID,
  type PaywallPlan,
  type PlanId,
} from '@/features/subscription/model/plans';
import { handOffPromo } from '@/features/subscription/model/promo-handoff';
import { canShowPromo } from '@/features/subscription/model/promo-sheet';
import { useOfferings } from '@/features/subscription/model/useOfferings';
import { usePurchase } from '@/features/subscription/model/usePurchase';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { homePath } from '@/shared/lib/last-tab';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { needsScrollToPlans } from '../_lib/plans-below-fold';
import {
  getBillingNotice,
  getCtaLabel,
  getRefundBillingNotice,
  getRefundCtaLabel,
} from '../_model/paywall-copy';
import { CompareSection } from './CompareSection';
import { DataSection } from './DataSection';
import { PaywallHeader } from './PaywallHeader';
import { PaywallHero } from './PaywallHero';
import { PlanSection } from './PlanSection';
import { PremiumOnlySection } from './PremiumOnlySection';
import { ReviewSection } from './ReviewSection';

// 닫기가 서버 회신을 기다리는 상한 — 넘으면 할인을 포기하고 보내 준다
const DISMISS_TIMEOUT_MS = 3000;

interface PaywallScreenProps {
  /** 결제·복원이 끝난 뒤 돌아갈 내부 경로. 학습 진입에서 막혀 왔을 때만 있고, 없으면 홈으로 간다 */
  returnTo?: string;
  /** 환급 챌린지를 켤지 — 기본은 배포 스위치(NEXT_PUBLIC_REFUND_CHALLENGE). 테스트와 미리보기만 넘긴다 */
  refundChallenge?: boolean;
}

export const PaywallScreen = ({
  returnTo,
  refundChallenge = REFUND_CHALLENGE_ENABLED,
}: PaywallScreenProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const [selectedId, setSelectedId] = useState<PlanId>(DEFAULT_PLAN_ID);
  // 맨 위 줄이 스크롤로 올라가면 닫기만 따로 띄운다
  const [scrolled, setScrolled] = useState(false);

  // 셸이 스토어 가격을 주면 카드 숫자를 그 값으로 다시 만든다 — 못 받으면 등록값 그대로.
  // 본 화면은 늘 정가다. 할인은 닫을 때 뜨는 시트에만 있다
  const tiers = useOfferings();
  const { list: pricing } = tiers;
  // 서버에 알리는 동안 닫기를 잠근다 — 연타하면 요청이 쌓이고 화면은 그대로다
  const [closing, setClosing] = useState(false);
  const plans = buildPaywallPlans(toKrwPrices(pricing));
  const selectedPlan = plans[selectedId];
  const plansRef = useRef<HTMLDivElement>(null);

  const goHome = () => router.replace(homePath());
  // 헤더 배지와 시트는 구독 응답의 promo를 본다 — 캐시에 얹어야 홈에 닿자마자 뜬다.
  // 넘기는 쪽은 모듈 스코프 스토어라 이 화면이 이미 사라진 뒤에 닿아도 헤더가 받는다
  const applyPromo = (promo: PaywallPromo) => {
    queryClient.setQueryData<MySubscription>(
      subscriptionKeys.mine(userId),
      (previous) => (previous ? { ...previous, promo } : previous),
    );
    handOffPromo(promo);
  };
  // 닫으면 서버에 알리고, 할인을 받으면 시트로 붙잡는다 —
  // 학습 진입에서 밀려 올라온 화면이라 온 곳으로 되돌리면 다시 페이월에 걸린다 (docs/subscription.md)
  const close = async () => {
    if (closing) return;
    // 할인을 못 보여줄 상황이면 알리지도 않는다. 서버가 찍은 5분은 한 번뿐이라 태우면 돌려받지 못한다
    if (!PROMO_ENABLED || !canShowPromo(tiers)) {
      goHome();
      return;
    }
    setClosing(true);
    const dismissal = dismissPaywall().catch(() => null);
    // 기록에 실패하거나 늦어도 닫히는 것을 막지 않는다 — 돈 내라는 화면에서 나가는 길이 먹통이면 안 된다
    const result = await Promise.race([
      dismissal,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), DISMISS_TIMEOUT_MS),
      ),
    ]);
    setClosing(false);
    if (result?.promo) {
      applyPromo(result.promo);
    } else {
      // 늦게 오더라도 받는다. 서버가 찍은 5분은 계정당 한 번뿐이라, 여기서 버리면 영영 못 본다
      void dismissal.then((late) => late?.promo && applyPromo(late.promo));
    }
    // 시트는 페이월 위가 아니라 홈에서 뜬다 — 나가려는 사람을 붙잡아 두지 않고 보내 준 뒤 한 번 더 권한다
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
    // 플랜 칸이 화면에 다 보이지 않으면 결제 대신 맨 아래로 내려 준다 — 무엇을 사는지 보고 누르게
    const plans = plansRef.current;
    const root = plans?.closest('[data-scroll-root]');
    if (
      plans &&
      root &&
      needsScrollToPlans(
        plans.getBoundingClientRect(),
        root.getBoundingClientRect(),
        // 아래 여백이 곧 하단 고정 CTA가 가리는 높이다
        parseFloat(getComputedStyle(root).paddingBottom) || 0,
      )
    ) {
      root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' });
      return;
    }
    track(EVENTS.PURCHASE_STARTED, { plan: selectedId });
    void purchase(selectedId);
  };

  const startRestore = () => {
    track(EVENTS.PURCHASE_RESTORE_TAPPED);
    void restore();
  };

  return (
    <main className="relative mx-auto h-dvh max-w-[430px] overflow-hidden bg-background">
      {/* 아래 여백은 하단 고정 CTA(버튼+안내 한 줄) 높이만큼 — 마지막 링크가 버튼 뒤에 깔리지 않게 */}
      <div
        data-scroll-root
        className="relative h-full overflow-y-auto pb-[calc(max(var(--safe-area-inset-bottom),12px)+124px)]"
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 48)}
      >
        {/* 닫기·구매 복원 — 고정하지 않고 무대와 함께 올라간다 */}
        <PaywallHeader
          onDark={refundChallenge}
          onClose={() => void close()}
          onRestore={startRestore}
          restoreDisabled={busy}
        />
        <PaywallHero refundChallenge={refundChallenge} />
        <PremiumOnlySection />
        <DataSection />
        <ReviewSection />
        <CompareSection />
        <div ref={plansRef} data-plan-section>
          <PlanSection
            plans={plans}
            selectedId={selectedId}
            onSelect={selectPlan}
            refundChallenge={refundChallenge}
            onRestore={startRestore}
            restoreDisabled={busy}
          />
        </div>
      </div>

      {/* 떠 있는 닫기 — 맨 위 줄이 올라간 뒤에도 언제든 닫을 수 있게. 바 전체를 고정하진 않는다 */}
      {scrolled && (
        <button
          type="button"
          onClick={() => void close()}
          aria-label="닫기"
          className="absolute top-[max(var(--safe-area-inset-top),8px)] left-3 z-30 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur transition-transform active:scale-90"
        >
          <CloseIcon size={20} />
        </button>
      )}

      {/* 위쪽은 투명에서 바탕색으로 번져, 스크롤되는 내용이 버튼 뒤로 자연스럽게 사라진다 */}
      <footer className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(to_bottom,transparent,var(--color-background)_28px)] px-5 pt-9 pb-[max(var(--safe-area-inset-bottom),12px)]">
        <Button onClick={startPurchase} loading={busy}>
          {refundChallenge
            ? getRefundCtaLabel(selectedPlan)
            : getCtaLabel(selectedPlan)}
        </Button>
        <p className="mt-3 text-center text-xs leading-[1.35] text-muted-foreground">
          {refundChallenge
            ? getRefundBillingNotice(selectedPlan)
            : getBillingNotice(selectedPlan)}
        </p>
      </footer>
    </main>
  );
};
