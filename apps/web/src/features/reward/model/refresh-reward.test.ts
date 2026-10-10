// 환급 미리받기의 계약 테스트
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as rewardApi from '../api/reward';
import { rewardKeys } from './keys';
import {
  refreshRewardAfterCompletion,
  refreshRewardAfterPurchase,
} from './refresh-reward';
import { rewardCycle, rewardView } from './reward.fixture';

vi.mock('../api/reward', () => ({ getMyRewards: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({ getCurrentUserId: () => 42 }));

const getMyRewards = vi.mocked(rewardApi.getMyRewards);
const key = rewardKeys.summary(42);
const outsider = rewardView({ state: 'NONE', current: null, today: null });
const next = rewardView({ current: rewardCycle({ balanceWon: 12411 }) });

// 받아 둔 환급이 이것인 캐시
const cacheWith = (cached?: ReturnType<typeof rewardView>) => {
  const queryClient = new QueryClient();
  if (cached) queryClient.setQueryData(key, cached);
  return queryClient;
};

beforeEach(() => {
  getMyRewards.mockReset();
  getMyRewards.mockResolvedValue(next);
});

describe('refreshRewardAfterCompletion', () => {
  it('참여자가 학습을 끝내면 새 금액을 미리 받아 둔다', async () => {
    const queryClient = cacheWith(rewardView());

    refreshRewardAfterCompletion(queryClient);

    await vi.waitFor(() => expect(queryClient.getQueryData(key)).toEqual(next));
  });

  it('환급과 상관없는 사람은 학습을 끝내도 묻지 않는다', () => {
    refreshRewardAfterCompletion(cacheWith(outsider));

    expect(getMyRewards).not.toHaveBeenCalled();
  });

  it('환급을 받아 본 적이 없으면 새로 묻지 않는다', () => {
    // given — 출시 전이라 환급 조회가 꺼져 있다
    refreshRewardAfterCompletion(cacheWith());

    expect(getMyRewards).not.toHaveBeenCalled();
  });
});

describe('refreshRewardAfterPurchase', () => {
  it('환급과 상관없던 사람도 새로 받는다', async () => {
    // given — 방금 환급 상품을 샀다. 받아 둔 답은 결제 전의 것이다
    const queryClient = cacheWith(outsider);

    refreshRewardAfterPurchase(queryClient);

    await vi.waitFor(() => expect(queryClient.getQueryData(key)).toEqual(next));
  });

  it('환급을 받아 본 적이 없으면 새로 묻지 않는다', () => {
    refreshRewardAfterPurchase(cacheWith());

    expect(getMyRewards).not.toHaveBeenCalled();
  });
});
