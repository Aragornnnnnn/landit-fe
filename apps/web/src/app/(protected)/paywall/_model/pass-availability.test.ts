// 100일 이용권을 지금 살 수 있는지 — 살 수 있다는 답을 들었을 때만 연다
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMyRewards } from '@/features/reward/api/reward';
import {
  endedRewardView,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { checkPassAvailability } from './pass-availability';

vi.mock('@/features/reward/api/reward', () => ({ getMyRewards: vi.fn() }));
const getRewards = vi.mocked(getMyRewards);

afterEach(() => {
  vi.useRealTimers();
  getRewards.mockReset();
});

describe('checkPassAvailability', () => {
  it('서버가 살 수 있다고 하면 살 수 있다', async () => {
    getRewards.mockResolvedValue(endedRewardView(0));

    expect(await checkPassAvailability()).toBe('available');
  });

  it('도는 챌린지가 있거나 결제를 검토 중이면 살 수 없다', async () => {
    getRewards.mockResolvedValue(rewardView({ purchaseAvailable: false }));

    expect(await checkPassAvailability()).toBe('unavailable');
  });

  it('조회가 실패하면 알 수 없다 — 살 수 있다고 넘겨짚지 않는다', async () => {
    getRewards.mockRejectedValue(new Error('network'));

    expect(await checkPassAvailability()).toBe('unknown');
  });

  it('응답에 값이 없으면 알 수 없다', async () => {
    getRewards.mockResolvedValue({
      ...rewardView(),
      purchaseAvailable: undefined,
    } as never);

    expect(await checkPassAvailability()).toBe('unknown');
  });

  it('제한 시간 안에 답이 없으면 알 수 없다', async () => {
    vi.useFakeTimers();
    getRewards.mockReturnValue(new Promise(() => {}));

    const checking = checkPassAvailability();
    // 제한 시간이 얼마로 바뀌어도 넘기게 넉넉히 돌린다
    await vi.advanceTimersByTimeAsync(60_000);

    expect(await checking).toBe('unknown');
  });

  it('받아 둔 값을 쓰지 않고 부를 때마다 새로 묻는다', async () => {
    getRewards.mockResolvedValue(endedRewardView(0));

    await checkPassAvailability();
    await checkPassAvailability();

    expect(getRewards).toHaveBeenCalledTimes(2);
  });
});
