'use client';

// 프리미엄 페이월 화면 — 길게 내려 보는 한 장(머리 → 프리미엄 시리즈 → 그림 학습 → 리뷰 → 비교표 → 플랜)과 아래 고정 CTA.
// 환급 챌린지 스위치가 켜지면 머리·플랜·CTA 문구가 환급용으로 바뀐다. 결제·복원은 usePurchase, 닫기는 usePaywallDismiss가 지휘하고,
// 여기서는 어느 플랜을 골랐는지와 버튼 상태만 안다
import { useRef, useState } from 'react';
import { EVENTS, type SubscriptionPlan } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { usePaywallDismiss } from '@/features/subscription/model/exit-promo/usePaywallDismiss';
import { REFUND_CHALLENGE_ENABLED } from '@/features/subscription/model/paywall-gate/payment-flag';
import { toKrwPrices } from '@/features/subscription/model/product/offering';
import {
  buildPaywallPlans,
  DEFAULT_PLAN_ID,
} from '@/features/subscription/model/product/plans';
import { useOffering } from '@/features/subscription/model/product/useOffering';
import { usePurchase } from '@/features/subscription/model/purchase/usePurchase';
import { track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { needsScrollToPlans } from '../_lib/plans-below-fold';
import {
  buildRefundPlans,
  FULL_REFUND_PLAN,
  isRefundPlan,
} from '../_model/paywall-content';
import {
  getBillingNotice,
  getCancelNotice,
  getCtaLabel,
  getRefundBillingNotice,
  getRefundCtaLabel,
  getRefundNotice,
} from '../_model/paywall-copy';
import { CompareSection } from './CompareSection';
import { DataSection } from './DataSection';
import { PaywallHeader } from './PaywallHeader';
import { PaywallHero } from './PaywallHero';
import { PlanSection } from './PlanSection';
import { PremiumOnlySection } from './PremiumOnlySection';
import { ReviewSection } from './ReviewSection';

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
  // 스위치에 따라 처음 고른 플랜이 다르다 — 켜지면 6개월(전액 환급), 꺼지면 연간
  const [selectedId, setSelectedId] = useState<SubscriptionPlan>(
    refundChallenge ? FULL_REFUND_PLAN : DEFAULT_PLAN_ID,
  );
  // 맨 위 줄이 스크롤로 올라가면 닫기만 따로 띄운다
  const [scrolled, setScrolled] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  // 셸이 스토어 가격을 주면 카드 숫자를 그 값으로 다시 만든다 — 못 받으면 등록값 그대로.
  // 본 화면은 늘 정가다. 할인은 닫을 때 뜨는 시트에만 있다
  const offering = useOffering();
  const packages = offering.regular;
  // 서버에 알리는 동안 닫기를 잠근다 — 연타하면 요청이 쌓이고 화면은 그대로다
  const [closing, setClosing] = useState(false);
  const prices = toKrwPrices(packages);
  const plans = buildPaywallPlans(prices);
  const refundPlans = buildRefundPlans(prices);
  // CTA와 그 밑 안내 두 줄 — 지금 플랜은 결제·해지 안내, 환급 플랜은 결제 안내와 최대 환급액
  const footer = isRefundPlan(selectedId)
    ? {
        label: getRefundCtaLabel(refundPlans[selectedId]),
        notices: [
          getRefundBillingNotice(refundPlans[selectedId]),
          getRefundNotice(refundPlans[selectedId]),
        ],
      }
    : {
        label: getCtaLabel(plans[selectedId]),
        notices: [
          getBillingNotice(plans[selectedId]),
          getCancelNotice(plans[selectedId]),
        ],
      };

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

  const selectPlan = (id: SubscriptionPlan) => {
    if (id === selectedId) return;
    setSelectedId(id);
    track(EVENTS.PAYWALL_PLAN_SELECTED, { plan: id });
  };

  const startPurchase = () => {
    // 플랜 칸이 화면에 다 보이지 않으면 결제 대신 맨 아래로 내려 준다 — 무엇을 사는지 보고 누르게
    const section = plansRef.current;
    const root = section?.closest('[data-scroll-root]');
    if (
      section &&
      root &&
      needsScrollToPlans(
        section.getBoundingClientRect(),
        root.getBoundingClientRect(),
        // 아래 여백이 곧 하단 고정 CTA가 가리는 높이다
        parseFloat(getComputedStyle(root).paddingBottom) || 0,
        root.scrollTop + root.clientHeight >= root.scrollHeight - 1,
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
      {/* 아래 여백은 하단 고정 CTA(버튼+안내 두 줄) 높이만큼 — 마지막 링크가 버튼 뒤에 깔리지 않게 */}
      <div
        data-scroll-root
        className="relative h-full overflow-y-auto pb-[calc(max(var(--safe-area-inset-bottom),12px)+142px)]"
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 48)}
      >
        {/* 닫기·구매 복원 — 고정하지 않고 머리와 함께 올라간다 */}
        <PaywallHeader
          dark={refundChallenge}
          onClose={() => void close()}
          onRestore={startRestore}
          restoreDisabled={busy}
        />
        <PaywallHero
          refundChallenge={refundChallenge}
          refundPlan={
            refundPlans[
              isRefundPlan(selectedId) ? selectedId : FULL_REFUND_PLAN
            ]
          }
        />
        <PremiumOnlySection />
        <DataSection />
        <ReviewSection />
        <CompareSection />
        <div ref={plansRef} data-plan-section>
          <PlanSection
            plans={plans}
            refundPlans={refundPlans}
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

      {/* 위쪽은 투명에서 바탕색으로 번져, 스크롤되는 내용이 버튼 뒤로 자연스럽게 사라진다.
          결제 안내는 버튼 바로 밑에 둔다 — 청구액·갱신·해지는 스토어 심사(3.1.2)가 결제 버튼 곁에서 확인한다 */}
      <footer className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(to_bottom,transparent,var(--color-background)_28px)] px-5 pt-9 pb-[max(var(--safe-area-inset-bottom),12px)]">
        <Button onClick={startPurchase} loading={busy}>
          {footer.label}
        </Button>
        {footer.notices.map((notice, index) => (
          <p
            key={notice}
            className={`${index === 0 ? 'mt-3' : 'mt-1'} text-center text-[11px] leading-[1.35] text-muted-foreground`}
          >
            {notice}
          </p>
        ))}
      </footer>
    </main>
  );
};
