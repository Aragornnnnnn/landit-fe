// 결제를 시킬 수 있는 환경인가 — 셸이 없으면 브라우저, 결제 메시지를 모르는 셸이면 업데이트 대상
import type { NativeContext } from '@landit/bridge';

// IDENTIFY·GET_OFFERINGS·PURCHASE·RESTORE_PURCHASES를 알아듣는 최소 브릿지 계약 버전
export const PURCHASE_BRIDGE_VERSION = 5;

export type PurchaseSupport = 'ready' | 'browser' | 'outdated-shell';

export const resolvePurchaseSupport = (
  context: NativeContext | null,
): PurchaseSupport => {
  if (!context) return 'browser';
  if (context.bridgeVersion < PURCHASE_BRIDGE_VERSION) return 'outdated-shell';
  return 'ready';
};
