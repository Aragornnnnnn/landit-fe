'use client';

// 구독 상태를 앰플리튜드 유저 속성으로 올리는 무렌더 컴포넌트 — 루트 레이아웃에 마운트 (IdentifySync와 같은 배선)
import { useEffect } from 'react';

import { setUserProperties } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';

import {
  toSubscriptionProperties,
  UNKNOWN_SUBSCRIPTION_PROPERTIES,
} from '../model/subscription-properties';
import { useSubscriptionQuery } from '../model/useSubscriptionQuery';

/**
 * 로그인한 사람의 유료 여부를 프로필에 올린다.
 *
 * 한 번도 못 받은 동안만 "아직 모름"으로 둔다 — 그 구간에 찍힌 이벤트를 나중에 골라낼 수 있게.
 * 로그아웃은 여기서 지우지 않는다. AnalyticsBootstrap의 reset이 프로필을 통째로 비운다.
 * 게이트와 달리 환경으로 조회를 끄지 않는다 — 브라우저·구버전 셸의 유료 여부도 같은 기준으로 세야 한다
 */
export const SubscriptionPropertiesSync = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const { subscription, isPending, isError } = useSubscriptionQuery();
  // 한 번이라도 받았으면 그 값을 믿는다 — 포그라운드 복귀 재조회가 실패해도(데이터는 남는다) 유료 여부를 잃지 않는다
  const known = subscription !== null || (!isPending && !isError);

  useEffect(() => {
    if (userId === null) return;
    setUserProperties(
      known
        ? toSubscriptionProperties(subscription)
        : UNKNOWN_SUBSCRIPTION_PROPERTIES,
    );
  }, [userId, known, subscription]);

  return null;
};
