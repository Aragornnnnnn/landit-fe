'use client';

// 이탈 할인을 열지 — 웹 스위치가 켜져 있고 한국어 화면일 때만. 페이월 닫기(서버에 알림)와 헤더 배지가 같은 기준을 본다
import { useLocale } from 'next-intl';

import { sellsKoreaOnlyOffers } from '@/shared/i18n/locale';

import { PROMO_ENABLED } from './promo-flag';

export const usePromoLive = () => {
  const locale = useLocale();
  return PROMO_ENABLED && sellsKoreaOnlyOffers(locale);
};
