'use client';

// 결제가 열린 환경인가 — 결제 플래그가 켜져 있고 앱 안일 때.
// 페이월 잠금과 결제 진입(마이페이지 카드·홈 헤더)이 이 한 기준을 같이 본다
import { useNativeContext } from '@/shared/bridge/useNativeContext';

import { PAYMENT_ENABLED } from './payment-flag';
import { isPaymentLive } from './paywall-gate';

export const usePaymentLive = (): boolean => {
  const nativeContext = useNativeContext();
  return isPaymentLive({
    paymentEnabled: PAYMENT_ENABLED,
    inApp: nativeContext !== null,
  });
};
