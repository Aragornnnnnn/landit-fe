'use client';

// 결제가 열린 환경인가 — 결제 플래그가 켜져 있고 앱 안일 때.
// 페이월 잠금과 결제 진입(마이페이지 카드·홈 헤더)이 이 한 기준을 같이 본다
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { PAYMENT_ENABLED } from './payment-flag';
import { canLockPaywall } from './paywall-gate';

export const usePaymentLive = (): boolean => {
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 브라우저로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  return canLockPaywall({
    paymentEnabled: PAYMENT_ENABLED,
    inApp: context !== null,
  });
};
