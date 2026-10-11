'use client';

// 셸에 시킬 수 있는 결제 동작과 그 허용 조건 — 페이월과 IdentifySync가 셸과 주고받는 것은 전부 이 파일을 거친다.
// 유료 여부는 여기서 판단하지 않는다. 셸의 회신을 그대로 돌려주고, 판단은 BE의 premium이 한다 (docs/subscription.md)
import { getNativeContext } from '@/shared/bridge/native-context';
import { requestFromNative } from '@/shared/bridge/request';
import { postToNative } from '@/shared/bridge/web-bridge';

/** IDENTIFY·GET_OFFERINGS·PURCHASE·RESTORE_PURCHASES를 알아듣는 최소 브릿지 계약 버전 */
export const PURCHASE_BRIDGE_VERSION = 5;

/** 결제를 시킬 수 있는 환경인가 — ready면 시킬 수 있고, 나머지 둘은 사용자에게 이유를 안내한다 */
export type PurchaseSupport = 'ready' | 'browser' | 'outdated-shell';

/**
 * 지금 환경에서 셸에 결제를 시킬 수 있는지 판정한다.
 *
 * 진입점(결제·복원·오퍼링·IDENTIFY)마다 따로 부른다 — 공유 상태 없이 각자 문 앞에서 확인한다.
 *
 * @param context 셸이 주입한 컨텍스트. 기본은 현재 창에서 읽은 값이고, 테스트만 직접 넣는다
 */
export const resolvePurchaseSupport = (
  context = getNativeContext(),
): PurchaseSupport => {
  if (!context) return 'browser';
  if (context.bridgeVersion < PURCHASE_BRIDGE_VERSION) return 'outdated-shell';
  return 'ready';
};

// 결제 시트는 사용자가 비밀번호·Face ID로 오래 붙잡을 수 있다. 오퍼링 조회는 네트워크 한 번이라 짧게
export const PURCHASE_TIMEOUT_MS = 5 * 60 * 1000;
export const RESTORE_TIMEOUT_MS = 60 * 1000;
export const OFFERINGS_TIMEOUT_MS = 8 * 1000;

/**
 * 패키지 하나를 결제한다. 스토어 결제 시트가 뜨고, 회신은 success·cancelled·error 중 하나다.
 *
 * @param packageId RevenueCat 패키지 identifier — 오퍼링에서 받았거나 표준값($rc_monthly 등)
 * @param signal 화면이 사라질 때 끊는 용도. 끊기면 null로 끝난다
 */
export const purchaseViaBridge = (packageId: string, signal?: AbortSignal) =>
  requestFromNative({
    request: { type: 'PURCHASE', packageId },
    replyType: 'PURCHASE_RESULT',
    timeoutMs: PURCHASE_TIMEOUT_MS,
    signal,
  });

/** 이전 구매를 복원한다. 복원할 게 없어도 success다 — 유료 여부는 BE가 판단한다 */
export const restoreViaBridge = (signal?: AbortSignal) =>
  requestFromNative({
    request: { type: 'RESTORE_PURCHASES' },
    replyType: 'RESTORE_RESULT',
    timeoutMs: RESTORE_TIMEOUT_MS,
    signal,
  });

/** 스토어 오퍼링의 패키지 목록을 받는다. 셸이 조회에 실패하면 빈 배열이 온다 */
export const fetchOfferingsViaBridge = (signal?: AbortSignal) =>
  requestFromNative({
    request: { type: 'GET_OFFERINGS' },
    replyType: 'OFFERINGS',
    timeoutMs: OFFERINGS_TIMEOUT_MS,
    signal,
  });

/**
 * 로그인 사용자를 RevenueCat 사용자로 묶는다. 회신은 없다.
 *
 * @param userId RevenueCat app_user_id. null이면 로그아웃
 */
export const identifyViaBridge = (userId: string | null) =>
  postToNative({ type: 'IDENTIFY', userId });

/**
 * 우리 회원을 RevenueCat app_user_id로 바꾼다 — 숫자 id를 문자열로, 로그아웃(회원 없음)은 null.
 * BE 웹훅이 이 문자열을 다시 숫자 id로 읽는다.
 */
export const toRevenueCatUserId = (
  member: { userId: number } | null | undefined,
): string | null => (member ? String(member.userId) : null);
