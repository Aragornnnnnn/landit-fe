'use client';

// 결제·복원 지휘 훅 — 환경 판정 → 셸에 요청 → 회신 분기 → 서버 유료 반영 확인 순으로 위에서 아래로 읽힌다.
// 화면은 busy로 버튼만 잠그고, 유료가 확인되면(또는 결제는 끝났는데 반영이 늦으면) onUnlocked로 다음 화면을 정한다
import { useEffect, useRef, useState } from 'react';
import { EVENTS, type PurchaseFailureReason } from '@landit/analytics';
import type { SubscriptionPlan } from '@landit/bridge';
import { useQueryClient } from '@tanstack/react-query';

import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { showToast } from '@/shared/ui/toast';

import { getMySubscription } from '../api/subscription';
import { subscriptionKeys } from './keys';
import { packageIdFor, type PlanPricingMap } from './offerings';
import {
  purchaseViaBridge,
  resolvePurchaseSupport,
  restoreViaBridge,
  type PurchaseSupport,
} from './shell-purchases';
import { PREMIUM_WAIT, waitForPremium } from './wait-for-premium';

interface UsePurchaseOptions {
  /** 셸이 준 가격표 — 결제할 패키지 id를 여기서 고른다. 비어 있으면 표준 identifier로 결제한다 */
  pricing: PlanPricingMap;
  /** 유료가 확인됐거나, 결제는 끝났는데 서버 반영이 늦을 때(안내 뒤) 불린다 — 보통 페이월을 닫는다 */
  onUnlocked: () => void;
}

// 결제를 시킬 수 없는 환경별 계측 사유와 안내 문구
const UNSUPPORTED: Record<
  Exclude<PurchaseSupport, 'ready'>,
  { reason: PurchaseFailureReason; message: string }
> = {
  browser: { reason: 'browser', message: '결제는 랜딧 앱에서 할 수 있어요' },
  'outdated-shell': {
    reason: 'outdated_shell',
    message: '앱을 최신 버전으로 업데이트하면 결제할 수 있어요',
  },
};

/** 결제를 시킬 수 없는 환경이면 그 사유와 안내, 시킬 수 있으면 null */
const findUnsupported = () => {
  const support = resolvePurchaseSupport();
  return support === 'ready' ? null : UNSUPPORTED[support];
};

/**
 * 페이월의 결제와 복원을 지휘한다.
 *
 * @returns `busy`는 셸 왕복이나 서버 확인이 진행 중인지, `purchase(plan)`·`restore()`는 각각 결제·복원을 시작한다
 */
export const usePurchase = ({ pricing, onUnlocked }: UsePurchaseOptions) => {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  // 화면이 사라지면 진행 중인 셸 왕복을 끊는다 — 결제 시트는 5분까지 기다리므로 회신이 사라진 화면에 닿지 않게.
  // 컨트롤러는 effect 안에서 만든다. 밖에서 만들면 dev의 effect 이중 실행이 한 번 끊은 컨트롤러가 그대로 남아 모든 요청이 즉시 null이 된다
  const lifetime = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    return () => controller.abort();
  }, []);

  // 서버가 유료로 바뀌었는지 몇 초 확인하고, 확인되면 구독 캐시에 바로 넣는다 — 게이트가 다시 조회하지 않아도 되게.
  // 기다리는 사이 계정이 바뀌었으면(로그아웃 뒤 다른 로그인) 그 응답은 다른 사람 것이라 캐시에 넣지 않는다
  const confirmPremium = async () => {
    const subscription = await waitForPremium(getMySubscription, PREMIUM_WAIT);
    const sameUser =
      (useAuthStore.getState().member?.userId ?? null) === userId;
    if (subscription && sameUser) {
      queryClient.setQueryData(subscriptionKeys.mine(userId), subscription);
    }
    return subscription !== null;
  };

  const purchase = async (plan: SubscriptionPlan) => {
    if (busy) return;
    const unsupported = findUnsupported();
    if (unsupported) {
      track(EVENTS.PURCHASE_FAILED, { plan, reason: unsupported.reason });
      showToast(unsupported.message);
      return;
    }

    const signal = lifetime.current?.signal;
    setBusy(true);
    try {
      const result = await purchaseViaBridge(
        packageIdFor(plan, pricing),
        signal,
      );
      if (signal?.aborted) return;

      if (!result) {
        track(EVENTS.PURCHASE_FAILED, { plan, reason: 'no_response' });
        showToast('결제 응답이 없어요. 잠시 후 다시 시도해 주세요');
        return;
      }
      if (result.status === 'cancelled') {
        track(EVENTS.PURCHASE_CANCELED, { plan });
        return;
      }
      if (result.status === 'error') {
        track(EVENTS.PURCHASE_FAILED, {
          plan,
          reason: 'shell_error',
          message: result.message,
        });
        showToast(
          result.message ?? '결제에 실패했어요. 잠시 후 다시 시도해 주세요',
        );
        return;
      }

      const unlocked = await confirmPremium();
      track(EVENTS.PURCHASE_COMPLETED, { plan, unlocked });
      // 기다리는 사이 화면을 떠났으면 안내와 이동은 하지 않는다 — 캐시 반영은 위에서 이미 끝났다
      if (signal?.aborted) return;
      // 스토어 결제는 끝났다 — 웹훅이 늦어도 사용자를 페이월에 붙잡아 두지 않는다
      if (!unlocked) {
        showToast('결제가 확인되는 중이에요. 잠시 후 다시 열어 주세요');
      }
      onUnlocked();
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    const unsupported = findUnsupported();
    if (unsupported) {
      track(EVENTS.PURCHASE_FAILED, { reason: unsupported.reason });
      showToast(unsupported.message);
      return;
    }

    const signal = lifetime.current?.signal;
    setBusy(true);
    try {
      const result = await restoreViaBridge(signal);
      if (signal?.aborted) return;

      if (!result || result.status === 'error') {
        track(EVENTS.PURCHASE_RESTORED, { succeeded: false });
        showToast(
          result?.message ??
            '구매 복원에 실패했어요. 잠시 후 다시 시도해 주세요',
        );
        return;
      }

      const unlocked = await confirmPremium();
      track(EVENTS.PURCHASE_RESTORED, { succeeded: unlocked });
      if (signal?.aborted) return;
      if (unlocked) onUnlocked();
      else showToast('복원할 구매 내역이 없어요');
    } finally {
      setBusy(false);
    }
  };

  return { busy, purchase, restore };
};
