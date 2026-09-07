'use client';

// 로그인 사용자를 셸의 RevenueCat에 묶는 무렌더 컴포넌트 — 루트 레이아웃에 마운트.
// 웹훅의 app_user_id가 이 값이 되므로, 로그인·로그아웃이 바뀔 때마다 IDENTIFY를 보낸다 (AnalyticsBootstrap과 같은 배선)
import { useEffect } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';
import { getNativeContext } from '@/shared/bridge/native-context';

import { webBridge } from '../model/bridge-request';
import { identifyViaBridge } from '../model/purchase-flow';
import { resolvePurchaseSupport } from '../model/purchase-support';

const toRevenueCatUserId = (userId: number | null | undefined) =>
  userId === null || userId === undefined ? null : String(userId);

export const IdentifySync = () => {
  useEffect(() => {
    // 결제 메시지를 모르는 셸·브라우저에는 보내지 않는다 — 폐기될 메시지라 경고만 남긴다
    if (resolvePurchaseSupport(getNativeContext()) !== 'ready') return;

    const { member } = useAuthStore.getState();
    if (member) identifyViaBridge(webBridge, toRevenueCatUserId(member.userId));

    return useAuthStore.subscribe((state, prev) => {
      const next = toRevenueCatUserId(state.member?.userId);
      if (next === toRevenueCatUserId(prev.member?.userId)) return;
      identifyViaBridge(webBridge, next);
    });
  }, []);

  return null;
};
