'use client';

// 결제가 열린 환경인가 — 결제 플래그가 켜져 있고 결제 브릿지가 실린 셸(1.3.0 이상)일 때.
// 페이월이 걸리는 환경(canLockPaywall)과 같은 기준이라, 결제 오픈에 맞춰 바뀌는 표시(스몰톡 무제한)가 페이월과 어긋나지 않는다
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { PAYMENT_ENABLED } from './payment-flag';
import { canLockPaywall } from './paywall-gate';

export const usePaymentLive = (): boolean => {
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 브라우저로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  return canLockPaywall({
    paymentEnabled: PAYMENT_ENABLED,
    appVersion: context?.appVersion ?? null,
  });
};
