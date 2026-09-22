'use client';

// 한시 할인 카운트다운 — 서버가 준 남은 초를 받은 순간 기준으로 재고, 0이 되면 끈다.
// 홈 헤더 배지와 할인 시트가 같이 쓴다
import { useEffect, useState } from 'react';

import type { PaywallPromo } from '../api/subscription';

const TICK_MS = 1000;

/** 끝나는 시각까지 남은 초. 이미 지났으면 0 */
const secondsLeft = (endsAt: number) =>
  Math.max(0, Math.ceil((endsAt - Date.now()) / TICK_MS));

/**
 * 할인이 끝날 때까지 남은 시간을 1초마다 새로 센다.
 *
 * 기준은 서버가 준 `remainingSeconds`를 받은 순간이다 — 기기 시계가 틀어져 있어도 맞는다.
 * 웹뷰가 백그라운드로 가면 타이머가 멈춰 그동안 흘러간 시간을 놓치므로, 돌아올 때 다시 잰다.
 *
 * @param promo 서버가 준 할인. 없거나 끝났으면 null
 * @returns 남은 초를 반영한 할인. 끝났으면 null
 */
export const usePromoOffer = (
  promo: PaywallPromo | null,
): PaywallPromo | null => {
  const [remaining, setRemaining] = useState(promo?.remainingSeconds ?? 0);
  // 객체가 아니라 값에 기댄다 — 조회할 때마다 새 객체가 와도 서버 값이 그대로면 타이머를 다시 시작하지 않는다
  const { remainingSeconds = null, expiresAt = null } = promo ?? {};

  useEffect(() => {
    if (remainingSeconds === null) return;
    // 받은 순간을 기준으로 끝나는 시각을 고정한다 — 이후 렌더에서 다시 재지 않는다
    const endsAt = Date.now() + remainingSeconds * TICK_MS;
    const sync = () => setRemaining(secondsLeft(endsAt));
    // 새 값을 받자마자 한 번 맞춘다 — 첫 틱을 기다리면 1초 동안 옛 숫자가 보인다
    sync();
    const timer = setInterval(sync, TICK_MS);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [remainingSeconds, expiresAt]);

  if (!promo || remaining <= 0) return null;
  return { ...promo, remainingSeconds: remaining };
};
