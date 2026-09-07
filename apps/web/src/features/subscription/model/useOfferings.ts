'use client';

// 셸에서 스토어 가격표를 받아 온다 — 결제 가능한 셸에서만 묻고, 못 받으면 빈 표(화면은 기본 표시값 유지)
import { useEffect, useState } from 'react';

import { getNativeContext } from '@/shared/bridge/native-context';

import { webBridge } from './bridge-request';
import { toPlanPricing, type PlanPricingMap } from './offerings';
import { fetchOfferingsViaBridge } from './purchase-flow';
import { resolvePurchaseSupport } from './purchase-support';

export const useOfferings = (): PlanPricingMap => {
  const [pricing, setPricing] = useState<PlanPricingMap>({});

  useEffect(() => {
    if (resolvePurchaseSupport(getNativeContext()) !== 'ready') return;
    let cancelled = false;
    void fetchOfferingsViaBridge(webBridge).then((offerings) => {
      if (!cancelled && offerings)
        setPricing(toPlanPricing(offerings.packages));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return pricing;
};
