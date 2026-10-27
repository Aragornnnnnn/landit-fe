'use client';

// 프리미엄 페이월 화면 — 길게 내려 보는 한 장(머리 → 프리미엄 시리즈 → 그림 학습 → 리뷰 → 비교표 → 플랜)과 아래 고정 CTA.
// 환급 챌린지 스위치가 켜지면 혜택 화면 → 결제 금액 안내 두 단계(RewardPaywall)로 바뀐다. 결제·복원은 usePurchase, 닫기는 usePaywallDismiss가 지휘하고,
// 여기서는 어느 플랜을 골랐는지와 버튼 상태만 안다
import { useEffect, useRef, useState } from 'react';
import {
  EVENTS,
  type PaywallSource,
  type SubscriptionPlan,
} from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { refreshRewardAfterPurchase } from '@/features/reward/model/refresh-reward';
import { usePaywallDismiss } from '@/features/subscription/model/exit-promo/usePaywallDismiss';
import { useRewardChallengeLive } from '@/features/subscription/model/paywall-gate/useRewardChallengeLive';
import {
  toKrwPrices,
  toRegularPrices,
} from '@/features/subscription/model/product/offering';
import {
  buildPaywallPlans,
  DEFAULT_PLAN_ID,
} from '@/features/subscription/model/product/plans';
import { useOffering } from '@/features/subscription/model/product/useOffering';
import {
  usePurchase,
  type UnlockReason,
} from '@/features/subscription/model/purchase/usePurchase';
import { sendAdEvent, track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { premiumOnboardingPath, type PaywallStep } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { needsScrollToPlans } from '../_lib/plans-below-fold';
import { checkPassAvailability } from '../_model/pass-availability';
import { buildRewardPlan, REWARD_PLAN_ID } from '../_model/paywall-content';
import {
  getBillingNotice,
  getCancelNotice,
  getCtaLabel,
} from '../_model/paywall-copy';
import { usePaywallExit } from '../_model/usePaywallExit';
import { CompareSection } from './CompareSection';
import { DataSection } from './DataSection';
import { PaywallHeader } from './PaywallHeader';
import { PaywallHero } from './PaywallHero';
import { PlanSection } from './PlanSection';
import { PremiumOnlySection } from './PremiumOnlySection';
import { ReviewSection } from './ReviewSection';
import { RewardPaywall } from './RewardPaywall';

interface PaywallScreenProps {
  /** 결제·복원이 끝난 뒤 돌아갈 내부 경로. 학습 진입에서 막혀 왔을 때만 있고, 없으면 홈으로 간다 */
  returnTo?: string;
  /** 환급 챌린지를 켤지 — 기본은 환급이 열린 환경인지(useRewardChallengeLive). 테스트와 미리보기만 넘긴다 */
  rewardChallenge?: boolean;
  /** 환급 페이월을 어느 단계에서 열지. 혜택을 이미 본 환급 화면에서 오면 결제 금액 안내부터 */
  startStep?: PaywallStep;
  /** 어느 문으로 왔나(?source=) — 단계 노출과 떠남에 실어 진입 경로별로 가른다 */
  source?: PaywallSource;
}

export const PaywallScreen = ({
  returnTo,
  rewardChallenge: forcedRewardChallenge,
  startStep,
  source,
}: PaywallScreenProps) => {
  const router = useRouter();
  const t = useTranslations('paywall.paywallCheckout');
  const tCommon = useTranslations('common');
  const rewardLive = useRewardChallengeLive();
  const rewardChallenge = forcedRewardChallenge ?? rewardLive;
  // 월간·연간 가운데 고른다(처음엔 연간). 환급 챌린지는 100일 이용권 하나라 고를 것이 없다
  const [selectedId, setSelectedId] =
    useState<SubscriptionPlan>(DEFAULT_PLAN_ID);
  // 맨 위 줄이 스크롤로 올라가면 닫기만 따로 띄운다
  const [scrolled, setScrolled] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  // 셸이 스토어 가격을 주면 카드 숫자를 그 값으로 다시 만든다 — 못 받으면 등록값 그대로.
  // 본 화면은 늘 정가다. 할인은 닫을 때 뜨는 시트에만 있다
  const offering = useOffering();
  const packages = offering.regular;
  // 서버에 알리는 동안 닫기를 잠근다 — 연타하면 요청이 쌓이고 화면은 그대로다
  const [closing, setClosing] = useState(false);
  // 월간·연간은 스토어 통화(원·엔)대로, 이용권은 환급 산식이 원화를 전제하므로 원화만
  const { currency, prices } = toRegularPrices(packages);
  const plans = buildPaywallPlans(prices, currency);
  const rewardPlan = buildRewardPlan(toKrwPrices(packages).pass);
  const regularPlan = plans[selectedId === 'monthly' ? 'monthly' : 'yearly'];
  // CTA 밑 결제·해지 안내 두 줄
  const notices = [
    getBillingNotice(regularPlan, t),
    getCancelNotice(regularPlan, t),
  ];

  // 페이월을 봤다고 메타에 알린다 — 결제 기준 광고 최적화로 넘어갈 때 쓸 중간 단계
  useEffect(() => {
    sendAdEvent('paywall_viewed');
  }, []);

  const goHome = () => router.replace(homePath());
  // 결제·복원 없이 떠나는 순간 — 환급 페이월은 단계를 RewardPaywall이 알려 준다
  const exit = usePaywallExit({
    variant: rewardChallenge ? 'reward' : 'regular',
    source,
    startStep: rewardChallenge ? (startStep ?? 'benefits') : 'single',
  });
  const dismiss = usePaywallDismiss(offering);
  // 닫으면 서버에 알린 뒤 홈으로 — 할인을 받았으면 시트는 홈에서 뜬다.
  // 환급 페이월은 알리지 않는다 — 이탈 할인은 연간 상품용이라 환급 플랜 화면에서 권하지 않는다.
  // 학습 진입에서 밀려 올라온 화면이라 온 곳으로 되돌리면 다시 페이월에 걸린다 (docs/subscription.md)
  const close = async () => {
    if (closing) return;
    exit.markClose();
    setClosing(true);
    if (!rewardChallenge) await dismiss();
    setClosing(false);
    goHome();
  };

  // 유료가 되면 원래 가려던 곳(게이트가 붙인 ?from=)으로 가되, 결제 직후면 프리미엄 온보딩을 거친다 — 캐시가 이미 유료라 다시 막히지 않는다
  const queryClient = useQueryClient();
  const unlock = (reason: UnlockReason) => {
    exit.markUnlocked();
    // 환급 상품을 샀으면 참여자가 된다 — 결제 전에 받아 둔 "환급과 상관없음"으로 다음 화면이 갈리지 않게 새로 받는다
    refreshRewardAfterPurchase(queryClient);
    const destination = returnTo ?? homePath();
    router.replace(
      reason === 'purchase' ? premiumOnboardingPath(destination) : destination,
    );
  };
  const { busy, purchase, restore } = usePurchase({
    packages,
    onUnlocked: unlock,
    checkPassAvailability,
    // 이용권은 스토어 통화대로 결제해도 된다고 정해 비교하지 않는다
    displayCurrencies: { monthly: currency, yearly: currency },
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

  // 환급 챌린지는 혜택 화면 → 결제 금액 안내 두 단계다. 고를 플랜이 없어 이용권으로 바로 결제한다
  if (rewardChallenge) {
    return (
      <RewardPaywall
        plan={rewardPlan}
        startStep={startStep}
        busy={busy}
        source={source}
        onStepChange={exit.noteStep}
        onScroll={exit.noteScroll}
        onClose={() => void close()}
        onRestore={startRestore}
        onPurchase={() => {
          track(EVENTS.PURCHASE_STARTED, { plan: REWARD_PLAN_ID });
          void purchase(REWARD_PLAN_ID);
        }}
      />
    );
  }

  return (
    <main className="relative mx-auto h-dvh max-w-[430px] overflow-hidden bg-background">
      {/* 아래 여백은 하단 고정 CTA(버튼+안내) 높이만큼 — 마지막 링크가 버튼 뒤에 깔리지 않게 */}
      <div
        data-scroll-root
        className="relative h-full overflow-y-auto pb-[calc(max(var(--safe-area-inset-bottom),12px)+142px)]"
        onScroll={(event) => {
          setScrolled(event.currentTarget.scrollTop > 48);
          exit.noteScroll(event.currentTarget);
        }}
      >
        {/* 닫기·구매 복원 — 고정하지 않고 머리와 함께 올라간다 */}
        <PaywallHeader
          onClose={() => void close()}
          onRestore={startRestore}
          restoreDisabled={busy}
        />
        <PaywallHero />
        <PremiumOnlySection />
        <DataSection />
        <ReviewSection />
        <CompareSection />
        <div ref={plansRef} data-plan-section>
          <PlanSection
            plans={plans}
            selectedId={selectedId}
            onSelect={selectPlan}
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
          aria-label={tCommon('closeLabel')}
          className="absolute top-[max(var(--safe-area-inset-top),8px)] left-3 z-30 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur transition-transform active:scale-90"
        >
          <CloseIcon size={20} />
        </button>
      )}

      {/* 위쪽은 투명에서 바탕색으로 번져, 스크롤되는 내용이 버튼 뒤로 자연스럽게 사라진다.
          결제 안내는 버튼 바로 밑에 둔다 — 청구액·갱신·해지는 스토어 심사(3.1.2)가 결제 버튼 곁에서 확인한다 */}
      <footer className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(to_bottom,transparent,var(--color-background)_28px)] px-5 pt-9 pb-[max(var(--safe-area-inset-bottom),12px)]">
        <Button onClick={startPurchase} loading={busy}>
          {getCtaLabel(regularPlan, t)}
        </Button>
        {notices.map((notice, index) => (
          <p
            key={notice}
            className={`${index === 0 ? 'mt-3' : 'mt-1'} text-center text-11 leading-[1.35] text-muted-foreground`}
          >
            {notice}
          </p>
        ))}
      </footer>
    </main>
  );
};
