'use client';

// 페이월에서 홈으로 넘기는 할인 — 닫자마자 받은 값을 홈의 헤더가 이어받아 시트로 연다.
// 라우팅을 건너 한 번만 전달되면 되는 값이라 서버에 묻지 않고 메모리에 둔다 (웹뷰는 이동해도 새로고침되지 않는다)
import { useSyncExternalStore } from 'react';

import type { PaywallPromo } from '../api/subscription';

let handed: PaywallPromo | null = null;
let sheetOpen = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** 페이월이 할인을 받아 홈으로 보낼 때 — 홈에 닿으면 시트가 저절로 열린다 */
export const handOffPromo = (promo: PaywallPromo) => {
  handed = promo;
  notify();
};

/** 시트를 닫으면 넘겨받은 값을 비운다 — 홈에 다시 와도 저절로 열리지 않는다 */
export const clearPromoHandoff = () => {
  if (handed === null) return;
  handed = null;
  notify();
};

/**
 * 페이월에서 넘겨받은 할인.
 *
 * 같은 객체를 계속 돌려주므로 시트가 이 값에 기대도 안전하다 — 5분이 지나 서버가 promo를 비워도
 * 열린 시트가 걷히지 않는다. 걷히는 순간 진행 중인 결제의 결과를 받을 곳이 사라진다
 */
export const useHandedPromo = () =>
  useSyncExternalStore(
    subscribe,
    () => handed,
    () => null,
  );

/** 할인 시트가 떠 있는지 알린다 — 홈의 다른 시트가 겹쳐 뜨지 않게 */
export const setPromoSheetOpen = (open: boolean) => {
  if (sheetOpen === open) return;
  sheetOpen = open;
  notify();
};

/** 지금 할인 시트가 떠 있는가. 5분짜리라 다른 시트보다 먼저 자리를 잡는다 */
export const usePromoSheetOpen = () =>
  useSyncExternalStore(
    subscribe,
    () => sheetOpen,
    () => false,
  );
