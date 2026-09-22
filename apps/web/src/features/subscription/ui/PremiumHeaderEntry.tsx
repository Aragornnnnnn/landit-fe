'use client';

// 헤더 왼쪽 자리 — 무료 사용자에게는 프리미엄 진입 알약, 한시 할인 중에는 남은 시간을 보여준다.
// 알약을 띄울 수 없는 상태(유료·결제 불가 환경)에서는 로고를 그대로 그린다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { SCENARIO_PATH } from '@/shared/lib/routes';
import { LanditLogo } from '@/shared/ui/LanditLogo';

import { useOfferings } from '../model/useOfferings';
import { usePaymentLive } from '../model/usePaymentLive';
import { usePromoOffer } from '../model/usePromoOffer';
import { useSubscriptionQuery } from '../model/useSubscriptionQuery';
import { GOLD_GRADIENT } from './premium-brand';
import { PromoSheet } from './PromoSheet';

/** 165초 → "02:45" */
const formatClock = (seconds: number) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const HomeLogo = () => (
  <Link href={SCENARIO_PATH} aria-label="홈으로">
    <LanditLogo className="h-5 w-auto text-foreground [&_.logo-dot-splash]:hidden" />
  </Link>
);

export const PremiumHeaderEntry = () => {
  const paymentLive = usePaymentLive();
  const { subscription } = useSubscriptionQuery({ enabled: paymentLive });
  const tiers = useOfferings();
  const promo = usePromoOffer(subscription?.promo ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 유료거나 결제를 시킬 수 없는 환경이면 팔 것이 없다 — 로고 자리를 원래대로 둔다
  if (!paymentLive || subscription?.premium) return <HomeLogo />;

  const openSheet = () => {
    track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'me' });
    setSheetOpen(true);
  };

  return (
    <>
      {promo ? (
        <button
          type="button"
          onClick={openSheet}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] leading-[1.2] font-bold text-[#4a2f00]"
          style={{ background: GOLD_GRADIENT }}
        >
          <span className="tracking-[0.1em]">PREMIUM</span>
          <span className="tabular-nums">
            {formatClock(promo.remainingSeconds)}
          </span>
        </button>
      ) : (
        <Link
          href="/paywall"
          onClick={() => track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'me' })}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] leading-[1.2] font-bold text-[#4a2f00]"
          style={{ background: GOLD_GRADIENT }}
        >
          <span className="tracking-[0.1em]">PREMIUM</span>
          <span>시작하기</span>
        </Link>
      )}

      {sheetOpen && promo && (
        <PromoSheet
          open
          promo={promo}
          tiers={tiers}
          onClose={() => setSheetOpen(false)}
          onUnlocked={() => setSheetOpen(false)}
        />
      )}
    </>
  );
};
