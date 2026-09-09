'use client';

// 셸에서 스토어 가격표를 받아 온다 — 결제 가능한 셸에서만 묻고, 못 받으면 빈 표(화면은 등록값을 유지)
import { useEffect, useState } from 'react';

import { toPlanPricing, type PlanPricingMap } from './offerings';
import {
  fetchOfferingsViaBridge,
  resolvePurchaseSupport,
} from './shell-purchases';

/**
 * 페이월이 뜰 때 셸에 오퍼링을 한 번 묻는다.
 *
 * @returns 플랜별 가격표. 브라우저·구버전 셸이거나 아직 못 받았으면 빈 객체
 */
export const useOfferings = (): PlanPricingMap => {
  const [pricing, setPricing] = useState<PlanPricingMap>({});

  useEffect(() => {
    if (resolvePurchaseSupport() !== 'ready') return;
    const controller = new AbortController();
    void fetchOfferingsViaBridge(controller.signal).then((offerings) => {
      if (offerings) setPricing(toPlanPricing(offerings.packages));
    });
    // 화면이 사라지면 끊는다 — 끊긴 왕복은 null로 끝나 setState가 일어나지 않는다
    return () => controller.abort();
  }, []);

  return pricing;
};
