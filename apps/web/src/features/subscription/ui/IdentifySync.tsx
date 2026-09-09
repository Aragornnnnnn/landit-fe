'use client';

// 로그인 사용자를 셸의 RevenueCat에 묶는 무렌더 컴포넌트 — 루트 레이아웃에 마운트.
// 웹훅의 app_user_id가 이 값이 되므로, 로그인·로그아웃이 바뀔 때마다 IDENTIFY를 보낸다 (AnalyticsBootstrap과 같은 배선)
import { useEffect } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  identifyViaBridge,
  resolvePurchaseSupport,
  toRevenueCatUserId,
} from '../model/shell-purchases';

/** 회원이 바뀔 때만 셸에 IDENTIFY를 보낸다. 결제 메시지를 모르는 셸·브라우저에는 보내지 않는다 */
export const IdentifySync = () => {
  useEffect(() => {
    if (resolvePurchaseSupport() !== 'ready') return;

    const { member } = useAuthStore.getState();
    if (member) identifyViaBridge(toRevenueCatUserId(member));

    // 같은 사용자로 토큰만 갱신되는 경우는 건너뛴다 — 셸의 logIn은 멱등이지만 왕복을 아낀다
    return useAuthStore.subscribe((state, prev) => {
      if (state.member?.userId === prev.member?.userId) return;
      identifyViaBridge(toRevenueCatUserId(state.member));
    });
  }, []);

  return null;
};
