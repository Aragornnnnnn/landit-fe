// 셸과 주고받는 결제 왕복 네 가지 — 메시지 모양과 제한 시간을 여기서 정한다. 판단은 하지 않는다
import type { NativeToWebMessage } from '@landit/bridge';

import { requestFromNative, type BridgeTransport } from './bridge-request';

// 결제 시트는 사용자가 비밀번호·Face ID로 오래 붙잡을 수 있다. 오퍼링 조회는 네트워크 한 번이라 짧게
export const PURCHASE_TIMEOUT_MS = 5 * 60 * 1000;
export const RESTORE_TIMEOUT_MS = 60 * 1000;
export const OFFERINGS_TIMEOUT_MS = 8 * 1000;

type PurchaseResult = Extract<NativeToWebMessage, { type: 'PURCHASE_RESULT' }>;
type RestoreResult = Extract<NativeToWebMessage, { type: 'RESTORE_RESULT' }>;
type Offerings = Extract<NativeToWebMessage, { type: 'OFFERINGS' }>;

export const purchaseViaBridge = (bridge: BridgeTransport, packageId: string) =>
  requestFromNative(
    bridge,
    { type: 'PURCHASE', packageId },
    (message): PurchaseResult | null =>
      message.type === 'PURCHASE_RESULT' ? message : null,
    PURCHASE_TIMEOUT_MS,
  );

export const restoreViaBridge = (bridge: BridgeTransport) =>
  requestFromNative(
    bridge,
    { type: 'RESTORE_PURCHASES' },
    (message): RestoreResult | null =>
      message.type === 'RESTORE_RESULT' ? message : null,
    RESTORE_TIMEOUT_MS,
  );

export const fetchOfferingsViaBridge = (bridge: BridgeTransport) =>
  requestFromNative(
    bridge,
    { type: 'GET_OFFERINGS' },
    (message): Offerings | null =>
      message.type === 'OFFERINGS' ? message : null,
    OFFERINGS_TIMEOUT_MS,
  );

// 단방향 — 회신이 없다. 로그인 직후와 결제 직전에 보내 순서를 보장한다 (셸 쪽은 멱등)
export const identifyViaBridge = (
  bridge: BridgeTransport,
  userId: string | null,
) => bridge.post({ type: 'IDENTIFY', userId });
