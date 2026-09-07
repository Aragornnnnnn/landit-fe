'use client';

// 결제·복원 지휘 훅 — 환경 판정 → 셸에 결제 요청 → 결과 분기 → 서버 유료 반영 대기까지 한 줄로 잇는다.
// 화면은 phase로 버튼 상태만 그리고, 성공하면 onUnlocked로 다음 화면을 정한다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import type { SubscriptionPlan } from '@landit/bridge';
import { useQueryClient } from '@tanstack/react-query';

import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { getNativeContext } from '@/shared/bridge/native-context';
import { showToast } from '@/shared/ui/toast';

import { getMySubscription } from '../api/subscription';
import { webBridge } from './bridge-request';
import { subscriptionKeys } from './keys';
import {
  identifyViaBridge,
  purchaseViaBridge,
  restoreViaBridge,
} from './purchase-flow';
import { resolvePurchaseSupport } from './purchase-support';
import { PREMIUM_WAIT, waitForPremium } from './wait-for-premium';

export type PurchasePhase = 'idle' | 'purchasing' | 'unlocking' | 'restoring';

interface UsePurchaseOptions {
  // 서버가 유료로 바뀌었거나(정상), 결제는 끝났는데 반영이 늦을 때(안내 후) 호출된다
  onUnlocked: () => void;
}

const SUPPORT_MESSAGE = {
  browser: '결제는 랜딧 앱에서 할 수 있어요',
  'outdated-shell': '앱을 최신 버전으로 업데이트하면 결제할 수 있어요',
} as const;

const fetchPremium = async () => (await getMySubscription()).premium;

export const usePurchase = ({ onUnlocked }: UsePurchaseOptions) => {
  const [phase, setPhase] = useState<PurchasePhase>('idle');
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  // 브라우저·구버전 셸이면 여기서 끝 — 안내만 하고 결제 요청을 보내지 않는다
  const ensureSupported = (plan: SubscriptionPlan) => {
    const support = resolvePurchaseSupport(getNativeContext());
    if (support === 'ready') return true;
    track(EVENTS.PURCHASE_FAILED, {
      plan,
      reason: support === 'browser' ? 'browser' : 'outdated_shell',
    });
    showToast(SUPPORT_MESSAGE[support]);
    return false;
  };

  const settleUnlock = async () => {
    setPhase('unlocking');
    const unlocked = await waitForPremium(fetchPremium, PREMIUM_WAIT);
    await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    return unlocked;
  };

  const purchase = async (plan: SubscriptionPlan, packageId: string) => {
    if (phase !== 'idle' || !ensureSupported(plan)) return;
    setPhase('purchasing');
    // 결제 직전에 한 번 더 — 로그인 직후 IDENTIFY가 셸에 닿기 전에 결제하는 순서 문제를 막는다
    if (userId !== null) identifyViaBridge(webBridge, String(userId));

    const result = await purchaseViaBridge(webBridge, packageId);

    if (!result) {
      track(EVENTS.PURCHASE_FAILED, { plan, reason: 'no_response' });
      showToast('결제 응답이 없어요. 잠시 후 다시 시도해 주세요');
      setPhase('idle');
      return;
    }
    if (result.status === 'cancelled') {
      track(EVENTS.PURCHASE_CANCELED, { plan });
      setPhase('idle');
      return;
    }
    if (result.status === 'error') {
      track(EVENTS.PURCHASE_FAILED, {
        plan,
        reason: result.message ?? 'unknown',
      });
      showToast(
        result.message ?? '결제에 실패했어요. 잠시 후 다시 시도해 주세요',
      );
      setPhase('idle');
      return;
    }

    const unlocked = await settleUnlock();
    track(EVENTS.PURCHASE_COMPLETED, { plan, unlocked });
    // 스토어 결제는 끝났다 — 웹훅이 늦어도 사용자를 페이월에 붙잡아 두지 않는다
    if (!unlocked)
      showToast('결제가 확인되는 중이에요. 잠시 후 다시 열어 주세요');
    setPhase('idle');
    onUnlocked();
  };

  const restore = async () => {
    // 복원은 플랜이 없다 — 환경 판정 계측은 연간으로 남긴다 (실패 사유가 중요하지 플랜은 아니다)
    if (phase !== 'idle' || !ensureSupported('yearly')) return;
    setPhase('restoring');
    if (userId !== null) identifyViaBridge(webBridge, String(userId));

    const result = await restoreViaBridge(webBridge);

    if (!result || result.status === 'error') {
      track(EVENTS.PURCHASE_RESTORED, { succeeded: false });
      showToast(
        result?.message ?? '구매 복원에 실패했어요. 잠시 후 다시 시도해 주세요',
      );
      setPhase('idle');
      return;
    }

    const unlocked = await settleUnlock();
    track(EVENTS.PURCHASE_RESTORED, { succeeded: unlocked });
    setPhase('idle');
    if (unlocked) onUnlocked();
    else showToast('복원할 구매 내역이 없어요');
  };

  return { phase, purchase, restore };
};
