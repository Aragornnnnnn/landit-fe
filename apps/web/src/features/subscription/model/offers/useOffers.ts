'use client';

// 지금 화면에서 무엇을 팔고 보여 줄지 — 언어·셸·시계·스위치를 읽어 판매 규칙(decideOffers)에 넘긴다.
// 페이월·홈·내 정보·온보딩·해지·계측이 이 한 기준을 같이 본다
import { useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';

import { useNativeContext } from '@/shared/bridge/useNativeContext';

import { PROMO_ENABLED } from '../exit-promo/promo-flag';
import { REWARD_CHALLENGE_ENABLED } from '../paywall-gate/payment-flag';
import { offerClock } from './offer-clock';
import { REFERRAL_UNTIL, REWARD_SALE_UNTIL } from './offer-schedule';
import { decideOffers, type Offers } from './offers';

export const useOffers = (): Offers => {
  const locale = useLocale();
  const context = useNativeContext();
  const now = useSyncExternalStore(
    offerClock.subscribe,
    offerClock.getSnapshot,
    offerClock.getSnapshot,
  );
  return decideOffers({
    locale,
    context,
    now,
    rewardEnabled: REWARD_CHALLENGE_ENABLED,
    rewardSaleUntil: REWARD_SALE_UNTIL,
    referralUntil: REFERRAL_UNTIL,
    promoEnabled: PROMO_ENABLED,
  });
};
