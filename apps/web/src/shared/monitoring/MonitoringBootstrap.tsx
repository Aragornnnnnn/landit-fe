'use client';

// 로그인 사용자를 Sentry에 묶는 무렌더 컴포넌트 — 루트 레이아웃에 마운트 (AnalyticsBootstrap·IdentifySync와 같은 배선)
import { useEffect } from 'react';

import { useAuthStore } from '@/shared/auth/auth-store';

import { setMonitoringUser } from './report';

export const MonitoringBootstrap = () => {
  useEffect(() => {
    const { member } = useAuthStore.getState();
    if (member) setMonitoringUser(member.userId);

    // 같은 사용자로 토큰만 갱신되는 경우는 건너뛴다. 최초 방문의 null→null도 여기서 걸러진다
    return useAuthStore.subscribe((state, prev) => {
      if (state.member?.userId === prev.member?.userId) return;
      setMonitoringUser(state.member?.userId ?? null);
    });
  }, []);

  return null;
};
