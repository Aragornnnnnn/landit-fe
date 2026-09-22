'use client';

// 한시 할인 카운트다운 — 서버가 준 남은 초를 받은 순간 기준으로 재고, 0이 되면 끈다.
// 홈 헤더 배지와 할인 시트가 같이 쓴다
import { useEffect, useState } from 'react';

import type { PaywallPromo } from '../api/subscription';

const TICK_MS = 1000;

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
  // 받은 값이 바뀌면 처음부터 다시 잰다 — 조회할 때마다 새 객체가 와도 값이 같으면 이어서 센다
  const key = promo ? `${promo.expiresAt}/${promo.remainingSeconds}` : '';
  const [progress, setProgress] = useState({ key: '', elapsed: 0 });

  useEffect(() => {
    if (!key) return;
    // 기준은 서버 값을 받은 순간이다. 시각 계산은 렌더 밖에서만 한다
    const startedAt = Date.now();
    const sync = () =>
      setProgress({
        key,
        elapsed: Math.floor((Date.now() - startedAt) / TICK_MS),
      });
    const timer = setInterval(sync, TICK_MS);
    // 웹뷰가 백그라운드에 다녀오면 그동안 타이머가 멈춰 있었다. 돌아올 때 흘러간 만큼 따라잡는다
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [key]);

  if (!promo) return null;
  // 값이 막 바뀐 렌더에서는 아직 한 톨도 안 흘렀다 — 0으로 봐야 갓 받은 할인이 만료로 보이지 않는다
  const elapsed = progress.key === key ? progress.elapsed : 0;
  const remaining = Math.max(0, promo.remainingSeconds - elapsed);
  return remaining > 0 ? { ...promo, remainingSeconds: remaining } : null;
};

/** 시트가 그릴 할인 한 벌 — 끝났어도 남은 시간 0으로 계속 그린다 */
export interface PromoDisplay {
  promo: PaywallPromo;
  expired: boolean;
}

/**
 * 시트에 넘길 값을 정한다.
 *
 * 만료돼도 걷지 않는 게 핵심이다 — 결제 시트가 떠 있는 동안 5분이 지나도 결과를 받아야 하므로,
 * 살아 있는 값이 사라지면 부여받은 원본을 0초로 만들어 자리를 지킨다.
 *
 * @param granted 부여받은 원본. 시트를 여는 쪽이 스냅샷해 둔 값이다
 * @param live 남은 시간이 반영된 값. 끝났으면 null
 */
export const resolvePromoDisplay = (
  granted: PaywallPromo | null,
  live: PaywallPromo | null,
): PromoDisplay | null => {
  if (live) return { promo: live, expired: false };
  if (granted)
    return { promo: { ...granted, remainingSeconds: 0 }, expired: true };
  return null;
};
