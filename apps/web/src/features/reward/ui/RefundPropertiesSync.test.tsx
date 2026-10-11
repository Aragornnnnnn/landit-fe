// 환급 유저 속성 동기화 — 답을 들은 뒤에만, 환급이 열렸을 때만 올리는지
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import type { RewardView } from '../api/reward';
import { rewardView } from '../model/reward.fixture';
import { RefundPropertiesSync } from './RefundPropertiesSync';

const mocks = vi.hoisted(() => ({
  setUserProperties: vi.fn(),
  asked: [] as boolean[],
  query: { reward: null as RewardView | null, loaded: false },
}));
vi.mock('@/shared/analytics', () => ({
  setUserProperties: mocks.setUserProperties,
}));
vi.mock('../model/useRewardQuery', () => ({
  useRewardQuery: ({ enabled }: { enabled: boolean }) => {
    mocks.asked.push(enabled);
    return mocks.query;
  },
}));

const signIn = () =>
  useAuthStore.getState().setAuth('access', 'refresh', {
    userId: 1,
    nickname: '준서',
    email: null,
    provider: 'kakao',
  });

beforeEach(() => {
  mocks.asked = [];
  mocks.query = { reward: null, loaded: false };
});
afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
});

describe('RefundPropertiesSync', () => {
  it('참여자의 답을 받으면 그 국면을 올린다', () => {
    signIn();
    mocks.query = { reward: rewardView(), loaded: true };

    render(<RefundPropertiesSync enabled />);

    expect(mocks.setUserProperties).toHaveBeenCalledWith({
      reward_state: 'active',
    });
  });

  it('다시 받아 금액만 바뀌면 다시 올리지 않는다', () => {
    signIn();
    mocks.query = { reward: rewardView(), loaded: true };
    const { rerender } = render(<RefundPropertiesSync enabled />);

    mocks.query = { reward: rewardView({ todayAchieved: true }), loaded: true };
    rerender(<RefundPropertiesSync enabled />);

    expect(mocks.setUserProperties).toHaveBeenCalledTimes(1);
  });

  it('답을 받았는데 참여자가 아니면 none을 올린다', () => {
    signIn();
    mocks.query = { reward: null, loaded: true };

    render(<RefundPropertiesSync enabled />);

    expect(mocks.setUserProperties).toHaveBeenCalledWith({
      reward_state: 'none',
    });
  });

  it('답을 받기 전에는 올리지 않는다 — 참여자가 잠깐 비참여자로 찍히면 안 된다', () => {
    signIn();

    render(<RefundPropertiesSync enabled />);

    expect(mocks.setUserProperties).not.toHaveBeenCalled();
  });

  it('환급이 열리기 전에는 묻지도 올리지도 않는다', () => {
    signIn();

    render(<RefundPropertiesSync enabled={false} />);

    expect(mocks.asked).toEqual([false]);
    expect(mocks.setUserProperties).not.toHaveBeenCalled();
  });

  it('로그인 전에는 올리지 않는다', () => {
    mocks.query = { reward: null, loaded: true };

    render(<RefundPropertiesSync enabled />);

    expect(mocks.setUserProperties).not.toHaveBeenCalled();
  });
});
