'use client';

// 탭 헤더 왼쪽 자리 — 무료 사용자에게는 프리미엄 진입 알약, 한시 할인 중에는 남은 시간을 보여준다.
// 팔 것이 없거나 아직 모를 때는 로고를 그려, 이 자리가 비거나 깜빡이지 않게 한다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { paywallPath, SCENARIO_PATH } from '@/shared/lib/routes';
import { LanditLogo } from '@/shared/ui/LanditLogo';

import type { PaywallPromo } from '../api/subscription';
import { PROMO_ENABLED } from '../model/payment-flag';
import { clearPromoHandoff, useHandedPromo } from '../model/promo-handoff';
import { usePaymentLive } from '../model/usePaymentLive';
import { resolvePromoDisplay, usePromoOffer } from '../model/usePromoOffer';
import { useSubscriptionQuery } from '../model/useSubscriptionQuery';
import { GOLD_GRADIENT } from './premium-brand';
import { PromoClock } from './PromoClock';
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
  const live = usePromoOffer(
    PROMO_ENABLED ? (subscription?.promo ?? null) : null,
  );
  // 시트는 열 때의 할인을 스냅샷해 들고 간다 — 구독 쿼리가 다시 조회돼 promo가 비어도
  // 열린 시트가 걷히면 안 된다. 걷히는 순간 진행 중인 결제의 결과를 받을 곳이 사라진다
  // 배지를 눌러 연 할인과, 페이월에서 넘어온 할인.
  // 구독 쿼리가 다시 조회돼 promo가 비어도 열린 시트가 걷히면 안 된다
  const [tappedPromo, setTappedPromo] = useState<PaywallPromo | null>(null);
  const handedPromo = useHandedPromo();
  const openedPromo = tappedPromo ?? handedPromo;
  const display = resolvePromoDisplay(openedPromo, live);

  const closeSheet = () => {
    setTappedPromo(null);
    clearPromoHandoff();
  };

  // 팔 것이 없거나(유료·결제 불가) 아직 모를 때는 로고를 둔다 — 결제한 사람에게 업셀이 잠깐이라도 보이면 안 된다
  if (!paymentLive || isPending || isError || subscription?.premium) {
    return <HomeLogo />;
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
          className={PILL_CLASS}
          style={{ background: GOLD_GRADIENT }}
        >
          <span className="tracking-[0.1em]">PREMIUM</span>
          {/* 숫자만 줄어들면 무엇이 끝나는지 알 수 없다. 눌러서 열리는 시트와 같은 말로 부른다 */}
          <span>할인</span>
          <PromoClock seconds={live.remainingSeconds} />
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

      {/* 배지가 보이는 동안 매달아 둔다 — 스토어 가격을 미리 받아 두면 눌렀을 때 기다리지 않는다 */}
      {display && (
        <PromoSheetHost
          open={openedPromo !== null}
          {...display}
          onClose={closeSheet}
          onUnlocked={closeSheet}
        />
      )}
    </>
  );
};
