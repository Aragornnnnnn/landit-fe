// SubscriptionPropertiesSync — 유료 여부를 언제 프로필에 올리는지의 계약 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setUserProperties } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';

import type { MySubscription } from '../api/subscription';
import { useSubscriptionQuery } from '../model/useSubscriptionQuery';
import { SubscriptionPropertiesSync } from './SubscriptionPropertiesSync';

vi.mock('@/shared/analytics', () => ({ setUserProperties: vi.fn() }));
const setUserPropertiesMock = vi.mocked(setUserProperties);

vi.mock('../model/useSubscriptionQuery');
const useSubscriptionQueryMock = vi.mocked(useSubscriptionQuery);

const login = () =>
  useAuthStore.setState({
    accessToken: 'access',
    refreshToken: 'refresh',
    member: { userId: 42, nickname: null, email: null, provider: 'KAKAO' },
  });

const active: MySubscription = {
  premium: true,
  subscriptionStatus: 'ACTIVE',
  periodType: 'NORMAL',
  expiresAt: '2026-10-04T12:00:00',
  productId: 'com.saynow.app.premium.monthly',
};

const arrange = (
  query: Partial<ReturnType<typeof useSubscriptionQuery>> = {},
) => {
  useSubscriptionQueryMock.mockReturnValue({
    subscription: null,
    isPending: false,
    isError: false,
    ...query,
  });
  render(<SubscriptionPropertiesSync />);
};

afterEach(() => {
  cleanup();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    member: null,
  });
});

describe('SubscriptionPropertiesSync', () => {
  it('로그인 전에는 아무것도 올리지 않는다 — 익명 프로필에 유료 여부를 남기지 않는다', () => {
    arrange();

    expect(setUserPropertiesMock).not.toHaveBeenCalled();
  });

  it('구독을 아직 못 받았으면 "아직 모름"을 올린다', () => {
    login();
    arrange({ isPending: true });

    expect(setUserPropertiesMock).toHaveBeenCalledWith({
      is_premium: null,
      subscription_state: 'unknown',
      plan: null,
    });
  });

  it('첫 조회가 실패한 동안도 "아직 모름"이다 — 무료로 단정하지 않는다', () => {
    login();
    arrange({ isError: true });

    expect(setUserPropertiesMock).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_state: 'unknown' }),
    );
  });

  it('받아 둔 구독이 있으면 재조회가 실패해도 유료 여부를 유지한다 — 포그라운드 복귀 때 잠깐 실패해도 유료가 지워지지 않게', () => {
    login();
    arrange({ subscription: active, isError: true });

    expect(setUserPropertiesMock).toHaveBeenCalledWith({
      is_premium: true,
      subscription_state: 'active',
      plan: 'monthly',
    });
  });

  it('구독이 도착하면 유료 여부·상태·플랜을 올린다', () => {
    login();
    arrange({ subscription: active });

    expect(setUserPropertiesMock).toHaveBeenCalledWith({
      is_premium: true,
      subscription_state: 'active',
      plan: 'monthly',
    });
  });

  it('유료가 아닌 사람은 "구독 없음"으로 올린다', () => {
    login();
    arrange();

    expect(setUserPropertiesMock).toHaveBeenCalledWith({
      is_premium: false,
      subscription_state: 'none',
      plan: null,
    });
  });
});
