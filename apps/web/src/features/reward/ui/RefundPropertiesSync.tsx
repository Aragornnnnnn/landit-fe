'use client';

// 환급 상태를 앰플리튜드 유저 속성으로 올리는 무렌더 컴포넌트 — 루트 레이아웃에 마운트 (SubscriptionPropertiesSync와 같은 배선)
import { useEffect } from 'react';

import { setUserProperties } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';

import { toRefundProperties } from '../model/refund-properties';
import { useRewardQuery } from '../model/useRewardQuery';

/**
 * 로그인한 사람의 환급 상태를 프로필에 올린다.
 *
 * 답을 받은 뒤에만 올린다 — 받기 전에 none을 올리면 참여자의 이벤트가 잠깐 비참여자로 찍힌다.
 *
 * @param enabled 환급이 열렸는가. 꺼져 있으면 조회도 속성도 없다
 */
export const RefundPropertiesSync = ({ enabled }: { enabled: boolean }) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const { reward, loaded } = useRewardQuery({ enabled });
  // 국면이 바뀔 때만 올린다 — 재조회마다 금액이 바뀌어도 프로필은 그대로다
  const state = loaded ? toRefundProperties(reward).reward_state : null;

  useEffect(() => {
    if (userId === null || !state) return;
    setUserProperties({ reward_state: state });
  }, [userId, state]);

  return null;
};
