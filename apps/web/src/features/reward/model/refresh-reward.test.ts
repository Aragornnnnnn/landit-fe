// 환급 미리받기의 계약 테스트
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as rewardApi from '../api/reward';
import { rewardKeys } from './keys';
import {
  fetchLatestReward,
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
  // 앱과 같은 신선 시간 — 받은 지 30초 안의 답은 다시 묻지 않는다
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  });
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

describe('fetchLatestReward', () => {
  it('참여자의 지금 환급을 받아 준다', async () => {
    expect(await fetchLatestReward(cacheWith())).toEqual(next);
  });

  it('결제 전에 받아 둔 답이 있어도 새로 받은 값을 준다', async () => {
    // given — 결제 직후. 받아 둔 답은 "환급과 상관없음"이고, 결제 뒤 미리받기가 막 출발했다
    const queryClient = cacheWith(outsider);
    refreshRewardAfterPurchase(queryClient);

    const latest = await fetchLatestReward(queryClient);

    expect(latest).toEqual(next);
    // 도는 요청에 합류한다 — 두 번 묻지 않는다
    expect(getMyRewards).toHaveBeenCalledTimes(1);
  });

  it('받아 둔 답이 신선하면 다시 묻지 않는다', async () => {
    const queryClient = cacheWith(rewardView());

    await fetchLatestReward(queryClient);

    expect(getMyRewards).not.toHaveBeenCalled();
  });

  it('새로 받으라고 하면 받아 둔 답이 신선해도 다시 묻는다', async () => {
    // given — 결제 직후 받은 답이 "환급과 상관없음"이었다. 서버 반영이 늦었을 수 있다
    const queryClient = cacheWith(outsider);

    expect(await fetchLatestReward(queryClient, { fresh: true })).toEqual(next);
  });

  it('환급과 상관없는 사람이면 null이다', async () => {
    getMyRewards.mockResolvedValue(outsider);

    expect(await fetchLatestReward(cacheWith())).toBe(null);
  });

  it('받지 못해도 던지지 않고 null을 준다', async () => {
    // given — 결제 직후의 흐름이 환급 조회 실패로 막히면 안 된다
    getMyRewards.mockRejectedValue(new Error('네트워크 오류'));

    expect(await fetchLatestReward(cacheWith())).toBe(null);
  });
});
