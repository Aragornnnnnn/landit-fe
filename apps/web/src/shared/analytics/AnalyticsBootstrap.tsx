'use client';

// 앰플리튜드 초기화 + 로그인 유저 식별 배선 — 루트 레이아웃에 마운트되는 무렌더 컴포넌트
import { useEffect } from 'react';

import type { AuthMember } from '@/shared/api/auth/social-login';
import { useAuthStore } from '@/shared/store/auth-store';

import { identifyUser, initAnalytics, resetUser } from './amplitude';

// 백엔드는 provider를 대문자(GOOGLE)로 주므로 이벤트 값과 맞춰 소문자로 통일한다
const identifyMember = (member: AuthMember) =>
  identifyUser(member.userId, { provider: member.provider.toLowerCase() });

export const AnalyticsBootstrap = () => {
  useEffect(() => {
    initAnalytics();

    const { member } = useAuthStore.getState();
    if (member) identifyMember(member);

    // 로그인 → 식별, 로그아웃(member 소실) → 익명 리셋. 최초 방문의 null은 리셋하지 않는다
    return useAuthStore.subscribe((state, prev) => {
      if (state.member === prev.member) return;
      if (state.member) {
        identifyMember(state.member);
      } else {
        resetUser();
      }
    });
  }, []);

  return null;
};
