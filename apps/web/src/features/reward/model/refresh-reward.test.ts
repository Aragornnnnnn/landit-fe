// 환급 미리받기의 계약 테스트
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as rewardApi from '../api/reward';
import { rewardKeys } from './keys';
import { refreshReward } from './refresh-reward';
import { rewardCycle, rewardView } from './reward.fixture';

vi.mock('../api/reward', () => ({ getMyRewards: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({ getCurrentUserId: () => 42 }));

const getMyRewards = vi.mocked(rewardApi.getMyRewards);
const key = rewardKeys.summary(42);

beforeEach(() => getMyRewards.mockReset());

describe('refreshReward', () => {
  it('받아 둔 환급이 있으면 새 금액으로 미리 받아 둔다', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(key, rewardView());
    const next = rewardView({ current: rewardCycle({ balanceWon: 12411 }) });
    getMyRewards.mockResolvedValue(next);

    refreshReward(queryClient);

    await vi.waitFor(() => expect(queryClient.getQueryData(key)).toEqual(next));
  });

  it('환급을 받아 본 적이 없으면 새로 묻지 않는다', () => {
    // given — 출시 전이라 환급 조회가 꺼져 있다
    const queryClient = new QueryClient();

    refreshReward(queryClient);

    expect(getMyRewards).not.toHaveBeenCalled();
  });
});
