'use client';

// 탭 헤더 왼쪽 자리 — 무료 사용자에게는 프리미엄 진입 알약, 한시 할인 중에는 남은 시간을 보여준다.
// 팔 것이 없거나 아직 모를 때는 로고를 그려, 이 자리가 비거나 깜빡이지 않게 한다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { paywallPath, SCENARIO_PATH } from '@/shared/lib/routes';
import { LanditLogo } from '@/shared/ui/LanditLogo';

import { formatPromoClock } from '../model/promo-clock';
import { usePaymentLive } from '../model/usePaymentLive';
import { usePromoOffer } from '../model/usePromoOffer';
import { useSubscriptionQuery } from '../model/useSubscriptionQuery';
import { GOLD_GRADIENT } from './premium-brand';
import { PromoSheetHost } from './PromoSheetHost';

/** 알약 한 벌 — 진입 링크와 할인 배지가 같은 모양이라 한 곳에 둔다 */
const PILL_CLASS =
  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] leading-[1.2] font-bold text-[#4a2f00]';

const HomeLogo = () => (
  <Link href={SCENARIO_PATH} aria-label="홈으로">
    <LanditLogo className="h-5 w-auto text-foreground [&_.logo-dot-splash]:hidden" />
  </Link>
);

export const PremiumHeaderEntry = () => {
  const paymentLive = usePaymentLive();
  const { subscription, isPending, isError } = useSubscriptionQuery({
    enabled: paymentLive,
  });
  const granted = subscription?.promo ?? null;
  const live = usePromoOffer(granted);
  const [sheetOpen, setSheetOpen] = useState(false);

  // 팔 것이 없거나(유료·결제 불가) 아직 모를 때는 로고를 둔다 — 결제한 사람에게 업셀이 잠깐이라도 보이면 안 된다
  if (!paymentLive || isPending || isError || subscription?.premium) {
    return <HomeLogo />;
  }

  const openSheet = () => {
    track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'header' });
    if (live) {
      track(EVENTS.PROMO_SHEET_VIEWED, { promo_campaign: live.campaignKey });
    }
    setSheetOpen(true);
  };

  return (
    <>
      {live ? (
        <button
          type="button"
          onClick={openSheet}
          className={PILL_CLASS}
          style={{ background: GOLD_GRADIENT }}
        >
          <span className="tracking-[0.1em]">PREMIUM</span>
          <span className="tabular-nums">
            {formatPromoClock(live.remainingSeconds)}
          </span>
        </button>
      ) : (
        <Link
          href={paywallPath({ source: 'header' })}
          onClick={() =>
            track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'header' })
          }
          className={PILL_CLASS}
          style={{ background: GOLD_GRADIENT }}
        >
          <span className="tracking-[0.1em]">PREMIUM</span>
          <span>시작하기</span>
        </Link>
      )}

      {/* 시트를 열 때만 매단다 — 매다는 순간 스토어 가격을 물으므로 평소에는 왕복이 없다.
          만료돼도 걷지 않는다: 결제 시트가 떠 있는 동안 5분이 지나도 결과를 받아야 한다 */}
      {sheetOpen && granted && (
        <PromoSheetHost
          promo={live ?? { ...granted, remainingSeconds: 0 }}
          expired={live === null}
          onClose={() => setSheetOpen(false)}
          onUnlocked={() => setSheetOpen(false)}
        />
      )}
    </>
  );
};
