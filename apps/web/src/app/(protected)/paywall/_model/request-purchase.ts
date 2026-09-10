// 결제 요청 자리 — 화면(LAN-446)은 이 함수만 부르고, 브릿지로 셸에 결제를 시키는 몸통은 LAN-447에서 채운다
import type { PlanId } from '@/features/subscription/model/plans';

export const requestPurchase = (planId: PlanId) => {
  void planId;
};

export const requestRestore = () => {};
