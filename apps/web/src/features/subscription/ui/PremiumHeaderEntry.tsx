'use client';

// 탭 헤더 왼쪽 자리 — 무료 사용자에게는 프리미엄 진입 알약, 한시 할인 중에는 남은 시간을 보여준다.
// 팔 것이 없거나 아직 모를 때는 로고를 그려, 이 자리가 비거나 깜빡이지 않게 한다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import {
  paywallPath,
  premiumOnboardingPath,
  SCENARIO_PATH,
} from '@/shared/lib/routes';
import { LanditLogo } from '@/shared/ui/LanditLogo';

import type { PaywallPromo } from '../api/subscription';
import { PROMO_ENABLED } from '../model/exit-promo/promo-flag';
import {
  clearPromoHandoff,
  useHandedPromo,
} from '../model/exit-promo/promo-handoff';
import {
  resolvePromoDisplay,
  usePromoOffer,
} from '../model/exit-promo/usePromoOffer';
import { useSubscriptionQuery } from '../model/my-subscription/useSubscriptionQuery';
import { usePaymentLive } from '../model/paywall-gate/usePaymentLive';
import type { UnlockReason } from '../model/purchase/usePurchase';
import { PromoClock } from './exit-promo/PromoClock';
import { PromoSheet } from './exit-promo/PromoSheet';

// 진입 링크와 할인 배지가 같은 모양이라 한 곳에 둔다.
// rounded-full을 쓰면 스몰톡 주제 칩과 같은 계열로 읽힌다 — 칩은 여럿 중 하나를 고르는 자리이고
// 이건 결제로 넘어가는 진입점이라, 마이페이지 프리미엄 카드와 같은 버튼 쪽 곡률을 쓴다
const PILL_CLASS =
  'flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] leading-[1.2] font-bold text-[#4a2f00]';

const HomeLogo = () => (
  <Link href={SCENARIO_PATH} aria-label="홈으로">
    <LanditLogo className="h-5 w-auto text-foreground [&_.logo-dot-splash]:hidden" />
  </Link>
);

interface PremiumHeaderEntryProps {
  // 무료 사용자의 진입을 페이월 대신 다른 곳으로 돌린다 — 환급 소개처럼, 구독이 모르는 화면을 라우트가 끼운다. 할인 중에는 할인 배지가 먼저다
  invite?: { href: string; label: React.ReactNode };
  // 부르는 쪽이 이 자리에 무엇을 놓을지 아직 모른다 — 그동안은 로고로 기다린다
  holding?: boolean;
}

export const PremiumHeaderEntry = ({
  invite,
  holding = false,
}: PremiumHeaderEntryProps) => {
  const paymentLive = usePaymentLive();
  const { subscription, isPending, isError } = useSubscriptionQuery({
    enabled: paymentLive,
  });
  const live = usePromoOffer(
    PROMO_ENABLED ? (subscription?.promo ?? null) : null,
  );
  // 배지를 눌러 연 할인과 페이월에서 넘어온 할인. 둘 다 열 때의 값을 복사해 들고 있는다 —
  // 구독 쿼리가 다시 조회돼 promo가 비어도 열려 있던 시트가 닫히면 안 된다
  const [tappedPromo, setTappedPromo] = useState<PaywallPromo | null>(null);
  const handedPromo = useHandedPromo();
  const openedPromo = tappedPromo ?? handedPromo;
  const display = resolvePromoDisplay(openedPromo, live);

  const closeSheet = () => {
    setTappedPromo(null);
    clearPromoHandoff();
  };

  // 할인 시트는 지금 화면 위에서 결제한다 — 결제면 프리미엄 온보딩을 거쳐 보던 화면(쿼리까지)으로 돌아오고, 복원은 시트만 닫는다
  const router = useRouter();
  const unlock = (reason: UnlockReason) => {
    closeSheet();
    if (reason === 'purchase') {
      router.push(premiumOnboardingPath(location.pathname + location.search));
    }
  };

  // 배지가 보이는 동안 매달아 둔다 — 스토어 가격을 미리 받아 두면 눌렀을 때 기다리지 않는다
  const sheet = display && (
    <PromoSheet
      open={openedPromo !== null}
      {...display}
      onClose={closeSheet}
      onUnlocked={unlock}
    />
  );

  // 이미 유료거나 결제할 수 없는 환경이거나 구독 상태를 아직 모를 때는 로고를 둔다 — 결제한 사람에게 구독 권유가 잠깐이라도 보이면 안 된다.
  // 다만 결제하는 사이 다른 조회로 유료가 먼저 들어와도 열린 시트는 남긴다 — 사라지면 결제 결과를 받지 못해 프리미엄 온보딩으로 못 간다
  if (
    holding ||
    !paymentLive ||
    isPending ||
    isError ||
    subscription?.premium
  ) {
    return (
      <>
        <HomeLogo />
        {openedPromo !== null && sheet}
      </>
    );
  }

  // 노출 계측은 시트가 실제로 그려질 때 시트 쪽에서 낸다 — 여기서 내면 못 그린 경우까지 센다
  const openSheet = () => {
    if (live) setTappedPromo(live);
  };

  return (
    <>
      {live ? (
        <button
          type="button"
          onClick={openSheet}
          className={`${PILL_CLASS} animate-gold-flow`}
        >
          <span className="tracking-[0.1em]">PREMIUM</span>
          {/* 숫자만 줄어들면 무엇이 끝나는지 알 수 없다. 눌러서 열리는 시트와 같은 말로 부른다 */}
          <span>할인</span>
          <PromoClock seconds={live.remainingSeconds} />
        </button>
      ) : (
        <Link
          href={invite?.href ?? paywallPath({ source: 'header' })}
          // 페이월로 가는 진입일 때만 센다 — 돌린 곳의 노출은 그 화면이 따로 센다
          onClick={
            invite
              ? undefined
              : () => track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'header' })
          }
          className={`${PILL_CLASS} animate-gold-flow animate-gold-sheen`}
        >
          {invite?.label ?? (
            <>
              <span className="tracking-[0.1em]">PREMIUM</span>
              <span>시작하기</span>
            </>
          )}
        </Link>
      )}

      {sheet}
    </>
  );
};
