'use client';

// 페이월 닫기 — 서버에 이탈을 알리고, 할인을 받으면 구독 캐시에 얹어 홈 헤더가 시트로 열게 넘긴다 (docs/subscription.md)
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  dismissPaywall,
  type MySubscription,
  type PaywallPromo,
} from '../../api/subscription';
import { subscriptionKeys } from '../my-subscription/keys';
import { PROMO_ENABLED } from '../paywall-gate/payment-flag';
import type { Offering } from '../product/offering';
import { handOffPromo } from './promo-handoff';
import { canShowPromo } from './promo-sheet';

// 닫기가 서버 회신을 기다리는 상한 — 넘으면 할인을 포기하지 않고 늦게 받는다
const DISMISS_TIMEOUT_MS = 3000;

/**
 * 페이월을 닫을 때 부를 함수를 돌려준다.
 *
 * 할인을 보여줄 수 없으면 서버에 알리지도 않는다. 서버가 찍은 5분은 계정당 한 번뿐이라 태우면 돌려받지 못한다.
 * 회신은 3초까지만 기다리고, 그보다 늦게 와도 받아서 넘긴다. 기록에 실패해도 에러 없이 끝난다.
 *
 * @param offering 현재 오퍼링 — 할인 시트를 그릴 수 있는지 판정한다
 */
export const usePaywallDismiss = (offering: Offering) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  // 헤더 배지와 시트는 구독 응답의 promo를 본다 — 캐시에 얹어야 홈에 닿자마자 뜬다.
  // 기다리는 사이 계정이 바뀌었으면(로그아웃 뒤 다른 로그인) 그 할인은 다른 사람 것이라 버린다
  const applyPromo = (promo: PaywallPromo) => {
    const sameUser =
      (useAuthStore.getState().member?.userId ?? null) === userId;
    if (!sameUser) return;
    queryClient.setQueryData<MySubscription>(
      subscriptionKeys.mine(userId),
      (previous) => (previous ? { ...previous, promo } : previous),
    );
    handOffPromo(promo);
  };

  return async () => {
    if (!PROMO_ENABLED || !canShowPromo(offering)) return;

    const dismissal = dismissPaywall().catch(() => null);
    const result = await Promise.race([
      dismissal,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), DISMISS_TIMEOUT_MS),
      ),
    ]);
    if (result?.promo) {
      applyPromo(result.promo);
      return;
    }
    void dismissal.then((late) => late?.promo && applyPromo(late.promo));
  };
};
