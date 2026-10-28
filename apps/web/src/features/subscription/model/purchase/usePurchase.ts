'use client';

// 결제·복원 지휘 훅 — 환경 판정 → (이용권이면 구매 가능 확인) → 셸에 요청 → 회신 분기 → 서버 유료 반영 확인 순으로 위에서 아래로 읽힌다.
// 화면은 busy로 버튼만 잠그고, 유료가 확인되면(또는 결제는 끝났는데 반영이 늦으면) onUnlocked로 다음 화면을 정한다
import { useEffect, useRef, useState } from 'react';
import { EVENTS, type PurchaseFailureReason } from '@landit/analytics';
import type { SubscriptionPlan } from '@landit/bridge';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations, type Messages } from 'next-intl';

import { track } from '@/shared/analytics';
import { getCurrentUserId } from '@/shared/auth/auth-store';
import { useCurrentUserId } from '@/shared/auth/current-member';
import type { Locale } from '@/shared/i18n/locale';
import { reportWarning } from '@/shared/monitoring/report';
import { showToast } from '@/shared/ui/toast';

import {
  purchaseViaBridge,
  resolvePurchaseSupport,
  restoreViaBridge,
  type PurchaseSupport,
} from '../../api/shell-purchases';
import { getMySubscription } from '../../api/subscription';
import { subscriptionKeys } from '../my-subscription/keys';
import { packageIdFor, type PlanPackages } from '../product/offering';
import { PREMIUM_WAIT, waitForPremium } from './wait-for-premium';

// 무엇으로 유료가 풀렸나 — 결제 직후에만 프리미엄 온보딩을 보이고, 복원은 원래 가던 곳으로 바로 보낸다
export type UnlockReason = 'purchase' | 'restore';

/** 100일 이용권을 지금 살 수 있는가 — 살 수 있음 · 살 수 없음 · 알 수 없음(조회 실패·시간 초과) */
export type PassAvailability = 'available' | 'unavailable' | 'unknown';

interface UsePurchaseOptions {
  /** 플랜별 패키지 — 결제할 패키지 id를 여기서 고른다. 비어 있으면 표준 identifier로 결제한다 */
  packages: PlanPackages;
  /** 유료가 확인됐거나, 결제는 끝났는데 서버 반영이 늦을 때(안내 뒤) 불린다 — 보통 페이월을 닫는다 */
  onUnlocked: (reason: UnlockReason) => void;
  /** 할인 패키지로 결제할 때 true(이탈 할인 시트·편지 혜택가) — 결제 이벤트에 할인 결제였음을 남긴다 */
  promo?: boolean;
  /**
   * 이용권을 지금 살 수 있는지 서버에 새로 묻는다 — 이용권을 파는 화면이 넘긴다.
   * 구매 가능 여부는 환급 도메인이 알아서 주입받는다. 받지 못했으면 이용권은 결제하지 않는다
   */
  checkPassAvailability?: () => Promise<PassAvailability>;
  /** 플랜별로 화면이 금액을 그린 통화 — 결제할 패키지의 통화가 이와 다르면 본 금액과 다른 돈이 나가므로 막는다 */
  displayCurrencies?: Partial<Record<SubscriptionPlan, string>>;
}

// 셸 결제 실패 문구의 언어 — 셸이 번역되기 전까지 한국어뿐이다. 한국 전용 상품의 언어 조건(sellsKoreaOnlyOffers)과는 따로 풀린다
const SHELL_MESSAGE_LOCALE: Locale = 'ko';

// 안내 토스트 문구 키 — subscription.purchase 아래
type PurchaseToastKey = keyof Messages['subscription']['purchase'];

// 화면 금액과 결제 통화가 다를 때의 계측 사유와 안내 문구 — 오퍼링이 덜 반영됐을 때라 잠시 뒤 다시 받으면 풀린다
const CURRENCY_MISMATCH = {
  reason: 'currency_mismatch',
  messageKey: 'currencyMismatchToast',
} as const;

// 이용권을 살 수 없을 때의 계측 사유와 안내 문구
const PASS_BLOCKED: Record<
  Exclude<PassAvailability, 'available'>,
  { reason: PurchaseFailureReason; messageKey: PurchaseToastKey }
> = {
  unavailable: {
    reason: 'pass_unavailable',
    messageKey: 'passUnavailableToast',
  },
  unknown: {
    reason: 'pass_check_failed',
    messageKey: 'passCheckFailedToast',
  },
};

// 결제를 시킬 수 없는 환경별 계측 사유와 안내 문구
const UNSUPPORTED: Record<
  Exclude<PurchaseSupport, 'ready'>,
  { reason: PurchaseFailureReason; messageKey: PurchaseToastKey }
> = {
  browser: { reason: 'browser', messageKey: 'browserToast' },
  'outdated-shell': {
    reason: 'outdated_shell',
    messageKey: 'outdatedShellToast',
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
export const usePurchase = ({
  packages,
  onUnlocked,
  promo,
  checkPassAvailability,
  displayCurrencies = {},
}: UsePurchaseOptions) => {
  // 결제 이벤트마다 같은 꼬리를 붙인다 — 정가 결제와 할인 결제를 나눠 보려면 전 구간에 있어야 한다
  const promoTag = promo ? { promo: true } : {};
  const t = useTranslations('subscription.purchase');
  const locale = useLocale();
  // 셸이 준 실패 사유 — 셸 문구와 같은 언어 화면에서만 쓰고, 다른 언어 화면에서는 버리고 웹 문구를 쓴다
  const shellMessage = (message?: string) =>
    locale === SHELL_MESSAGE_LOCALE ? message : undefined;
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

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
    const sameUser = getCurrentUserId() === userId;
    if (subscription && sameUser) {
      queryClient.setQueryData(subscriptionKeys.mine(userId), subscription);
    }
    return subscription !== null;
  };

  // 스토어는 이용 기간이 남아 있어도 같은 이용권을 다시 판다 — 돈만 나가고 이용권은 늘지 않으니 살 수 있다는 답을 들었을 때만 연다
  const findPassBlock = async () => {
    // 확인할 방법을 받지 못했거나 확인이 던지면 알 수 없는 것으로 친다 — 넘겨짚어 결제하지 않는다
    const availability: PassAvailability = checkPassAvailability
      ? await checkPassAvailability().catch(() => 'unknown' as const)
      : 'unknown';
    return availability === 'available' ? null : PASS_BLOCKED[availability];
  };

  // 회신 전에 화면을 떠났다 — 결과를 모르니 시작만 덩그러니 남지 않게 닫아 둔다
  const trackLeftScreen = (plan: SubscriptionPlan) =>
    track(EVENTS.PURCHASE_FAILED, {
      plan,
      reason: 'left_screen',
      ...promoTag,
    });

  const purchase = async (plan: SubscriptionPlan) => {
    if (busy) return;
    const unsupported = findUnsupported();
    if (unsupported) {
      track(EVENTS.PURCHASE_FAILED, {
        plan,
        reason: unsupported.reason,
        ...promoTag,
      });
      showToast(t(unsupported.messageKey));
      return;
    }
    const pkg = packages[plan];
    const shownCurrency = displayCurrencies[plan];
    if (pkg && shownCurrency && pkg.currency !== shownCurrency) {
      track(EVENTS.PURCHASE_FAILED, {
        plan,
        reason: CURRENCY_MISMATCH.reason,
        ...promoTag,
      });
      showToast(t(CURRENCY_MISMATCH.messageKey));
      reportWarning('화면 금액과 결제 패키지의 통화가 다르다', {
        plan,
        shownCurrency,
        packageCurrency: pkg.currency,
      });
      return;
    }

    const signal = lifetime.current?.signal;
    setBusy(true);
    try {
      if (plan === 'pass') {
        const blocked = await findPassBlock();
        // 묻는 사이 화면을 떠났거나 계정이 바뀌었으면 그 답으로 결제하지 않는다
        if (signal?.aborted) {
          trackLeftScreen(plan);
          return;
        }
        if (getCurrentUserId() !== userId) return;
        if (blocked) {
          track(EVENTS.PURCHASE_FAILED, {
            plan,
            reason: blocked.reason,
            ...promoTag,
          });
          showToast(t(blocked.messageKey));
          return;
        }
      }

      const result = await purchaseViaBridge(
        packageIdFor(plan, packages),
        signal,
      );
      if (signal?.aborted) {
        trackLeftScreen(plan);
        return;
      }

      if (!result) {
        track(EVENTS.PURCHASE_FAILED, {
          plan,
          reason: 'no_response',
          ...promoTag,
        });
        showToast(t('noResponseToast'));
        return;
      }
      if (result.status === 'cancelled') {
        track(EVENTS.PURCHASE_CANCELED, { plan, ...promoTag });
        return;
      }
      if (result.status === 'error') {
        track(EVENTS.PURCHASE_FAILED, {
          plan,
          reason: 'shell_error',
          message: result.message,
          ...promoTag,
        });
        showToast(shellMessage(result.message) ?? t('failedToast'));
        return;
      }

      const premiumConfirmed = await confirmPremium();
      // 금액은 셸이 준 스토어 가격 그대로 — 오퍼링을 못 받아 표준 패키지로 결제했으면 없다
      const paidPackage = packages[plan];
      track(EVENTS.PURCHASE_COMPLETED, {
        plan,
        unlocked: premiumConfirmed,
        ...(paidPackage && {
          price: paidPackage.price,
          currency: paidPackage.currency,
        }),
        ...promoTag,
      });
      // 기다리는 사이 화면을 떠났으면 안내와 이동은 하지 않는다 — 캐시 반영은 위에서 이미 끝났다
      if (signal?.aborted) return;
      // 스토어 결제는 끝났다 — 웹훅이 늦어도 사용자를 페이월에 붙잡아 두지 않는다
      if (!premiumConfirmed) {
        showToast(t('pendingToast'));
      }
      onUnlocked('purchase');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    const unsupported = findUnsupported();
    if (unsupported) {
      track(EVENTS.PURCHASE_FAILED, { reason: unsupported.reason });
      showToast(t(unsupported.messageKey));
      return;
    }

    const signal = lifetime.current?.signal;
    setBusy(true);
    try {
      const result = await restoreViaBridge(signal);
      if (signal?.aborted) return;

      if (!result || result.status === 'error') {
        track(EVENTS.PURCHASE_RESTORED, { succeeded: false });
        showToast(shellMessage(result?.message) ?? t('restoreFailedToast'));
        return;
      }

      const premiumConfirmed = await confirmPremium();
      track(EVENTS.PURCHASE_RESTORED, { succeeded: premiumConfirmed });
      if (signal?.aborted) return;
      if (premiumConfirmed) onUnlocked('restore');
      else showToast(t('restoreEmptyToast'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, purchase, restore };
};
