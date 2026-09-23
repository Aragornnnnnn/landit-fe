'use client';

// 한시 할인 카운트다운 — 처음 받은 순간에 끝나는 때를 정해 두고 1초마다 재며, 0이 되면 끈다.
// 홈 헤더 배지와 할인 시트가 같이 쓴다
import { useEffect, useState } from 'react';

import type { PaywallPromo } from '../api/subscription';

const TICK_MS = 1000;

// 할인마다 끝나는 때를 기기 시계로 한 번만 정해 둔다.
// 이걸 두지 않으면 화면을 나갔다 들어올 때마다 캐시에 담긴 남은 초부터 다시 세어 5분이 늘어난다.
// 서버 시각을 그대로 쓰지 않는 건 기기 시계가 틀어져 있어도 맞아야 하기 때문이다
let deadline: { expiresAt: string; at: number } | null = null;

const deadlineFor = (expiresAt: string, remainingSeconds: number) => {
  if (deadline?.expiresAt !== expiresAt) {
    deadline = { expiresAt, at: Date.now() + remainingSeconds * TICK_MS };
  }
  return deadline.at;
};

/**
 * 할인이 끝날 때까지 남은 시간을 1초마다 새로 센다.
 *
 * 끝나는 때는 이 할인을 처음 받은 순간에 한 번 정해진다 — 화면을 오가며 다시 마운트해도
 * 5분이 늘어나지 않고, 기기 시계가 서버와 달라도 맞는다.
 * 웹뷰가 백그라운드로 가면 타이머가 멈춰 그동안 흘러간 시간을 놓치므로, 돌아올 때 다시 잰다.
 *
 * @param promo 서버가 준 할인. 없거나 끝났으면 null
 * @returns 남은 초를 반영한 할인. 끝났으면 null
 */
export const usePromoOffer = (
  promo: PaywallPromo | null,
): PaywallPromo | null => {
  const expiresAt = promo?.expiresAt ?? '';
  const granted = promo?.remainingSeconds ?? 0;
  const [counted, setCounted] = useState({ key: '', remaining: 0 });

  useEffect(() => {
    if (!expiresAt) return;
    const endsAt = deadlineFor(expiresAt, granted);
    // 시각 계산은 렌더 밖에서만 한다
    const sync = () =>
      setCounted({
        key: expiresAt,
        remaining: Math.max(0, Math.round((endsAt - Date.now()) / TICK_MS)),
      });
    sync();
    const timer = setInterval(sync, TICK_MS);
    // 웹뷰가 백그라운드에 다녀오면 그동안 타이머가 멈춰 있었다. 돌아올 때 흘러간 만큼 따라잡는다
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [expiresAt, granted]);

  if (!promo) return null;
  // 아직 한 번도 세지 않은 렌더에서는 서버가 준 값을 그대로 쓴다
  const remaining =
    counted.key === expiresAt ? counted.remaining : promo.remainingSeconds;
  return remaining > 0 ? { ...promo, remainingSeconds: remaining } : null;
};

/** 시트에 넘길 할인과 만료 여부 — 만료돼도 남은 시간 0으로 계속 그린다 */
export interface PromoDisplay {
  promo: PaywallPromo;
  expired: boolean;
}

/**
 * 시트에 넘길 값을 정한다.
 *
 * 5분이 지나 `live`가 null이 돼도 시트를 닫지 않는다. 스토어 결제 시트를 띄운 채 만료되는
 * 일이 흔한데, 여기서 닫으면 결제 결과를 받을 화면이 사라진다. 그래서 `granted`를
 * `expired: true`로 대신 내보낸다.
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
