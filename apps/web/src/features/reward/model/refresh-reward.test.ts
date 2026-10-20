// 환급 미리받기의 계약 테스트
import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as rewardApi from '../api/reward';
import { rewardKeys } from './keys';
import { clearMissedEarn, hasMissedEarn } from './missed-earn';
import {
  fetchLatestReward,
  refreshRewardAfterCompletion,
  refreshRewardAfterPurchase,
} from './refresh-reward';
import { earnedRewardToday, rewardCycle, rewardView } from './reward.fixture';

vi.mock('../api/reward', () => ({ getMyRewards: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({ getCurrentUserId: () => 42 }));

const getMyRewards = vi.mocked(rewardApi.getMyRewards);
const key = rewardKeys.summary(42);
const outsider = rewardView({ state: 'NONE', current: null, today: null });
const next = rewardView({ current: rewardCycle({ balanceWon: 5000 }) });

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

// 오늘의 시나리오를 처음 끝낸 완료 — 적립 대상이다
const FIRST = { todaysFirst: true };

describe('refreshRewardAfterCompletion', () => {
  it('참여자가 시나리오를 끝내면 새 금액을 미리 받아 둔다', async () => {
    const queryClient = cacheWith(rewardView());

    refreshRewardAfterCompletion(queryClient, FIRST);

    await vi.waitFor(() => expect(queryClient.getQueryData(key)).toEqual(next));
  });

  it('받아 둔 내역은 버린다 — 다음에 열 때 첫 장부터 새로 받게', () => {
    const queryClient = cacheWith(rewardView());
    const historyKey = rewardKeys.history(42);
    queryClient.setQueryData(historyKey, { pages: [], pageParams: [] });

    refreshRewardAfterCompletion(queryClient, FIRST);

    expect(queryClient.getQueryData(historyKey)).toBeUndefined();
  });

  it('환급과 상관없는 사람은 시나리오를 끝내도 묻지 않는다', () => {
    refreshRewardAfterCompletion(cacheWith(outsider), FIRST);

    expect(getMyRewards).not.toHaveBeenCalled();
  });

  it('오늘 몫이 아직이었다는 걸 적어 둔다 — 축하 화면이 받은 금액을 보여 줄지 정한다', () => {
    const queryClient = cacheWith(rewardView());

    refreshRewardAfterCompletion(queryClient, FIRST);

    expect(queryClient.getQueryData(rewardKeys.earnBase(42))).toEqual({
      date: '2026-10-10',
    });
  });

  it('오늘 몫을 이미 받은 사람이 시나리오를 또 끝내면 전에 적어 둔 것을 지운다', () => {
    const queryClient = cacheWith(rewardView({ today: earnedRewardToday() }));
    queryClient.setQueryData(rewardKeys.earnBase(42), { date: '2026-10-10' });

    refreshRewardAfterCompletion(queryClient, FIRST);

    expect(queryClient.getQueryData(rewardKeys.earnBase(42))).toBeNull();
  });

  it('환급과 상관없는 사람이 대화를 끝내면 전에 적어 둔 것을 지운다', () => {
    const queryClient = cacheWith(outsider);
    queryClient.setQueryData(rewardKeys.earnBase(42), { date: '2026-10-10' });

    refreshRewardAfterCompletion(queryClient, FIRST);

    expect(queryClient.getQueryData(rewardKeys.earnBase(42))).toBeNull();
  });

  it('환급을 받아 본 적이 없으면 새로 묻지 않는다', () => {
    // given — 출시 전이라 환급 조회가 꺼져 있다
    refreshRewardAfterCompletion(cacheWith(), FIRST);

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

  it('결제하면 대화를 끝낼 때 적어 둔 「받을 수 있었던 몫」을 지운다 — 홈에서 500원 알약이 떴다 사라지지 않게', () => {
    // given — 무료로 오늘의 시나리오를 끝내 표시가 남은 채 페이월에서 결제했다
    refreshRewardAfterCompletion(cacheWith(outsider), FIRST);
    expect(hasMissedEarn(42)).toBe(true);

    // when
    refreshRewardAfterPurchase(cacheWith(outsider));

    // then — 이제 실제로 쌓이는 사람이라 놓친 몫이 아니다
    expect(hasMissedEarn(42)).toBe(false);
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

describe('refreshRewardAfterCompletion — 환급을 시작하지 않은 사람', () => {
  afterEach(clearMissedEarn);

  it('오늘의 시나리오를 처음 끝냈으면 받을 수 있었던 몫이 있다고 적어 둔다 — 홈이 그걸 한 번 보여 준다', () => {
    refreshRewardAfterCompletion(cacheWith(outsider), FIRST);

    expect(hasMissedEarn(42)).toBe(true);
  });

  it('지난 시나리오를 끝냈거나 오늘 것을 다시 한 것이면 적지 않는다 — 적립 대상이 아니다', () => {
    refreshRewardAfterCompletion(cacheWith(outsider), { todaysFirst: false });

    expect(hasMissedEarn(42)).toBe(false);
  });

  it('참여자는 적지 않는다 — 그 사람의 몫은 실제로 쌓인다', () => {
    refreshRewardAfterCompletion(cacheWith(rewardView()), FIRST);

    expect(hasMissedEarn(42)).toBe(false);
  });

  it('환급을 받아 본 적이 없으면(출시 전) 적지 않는다', () => {
    refreshRewardAfterCompletion(cacheWith(), FIRST);

    expect(hasMissedEarn(42)).toBe(false);
  });
  it('무료로 쌓는 사람이 오늘의 시나리오를 처음 끝내면 놓친 금액을 새로 받고 무료 기록은 버린다', async () => {
    // given — 무료 미리보기를 받아 둔 사람. 무료 기록도 받아 둔 장이 있다
    const free = rewardView({
      ...outsider,
      preview: {
        balanceWon: 1000,
        completedDays: 2,
        todayEarnedWon: 0,
        dailyAmountWon: 500,
        accruing: true,
      },
    });
    const queryClient = cacheWith(free);
    const previewHistoryKey = rewardKeys.previewHistory(42);
    queryClient.setQueryData(previewHistoryKey, { pages: [], pageParams: [] });

    refreshRewardAfterCompletion(queryClient, FIRST);

    expect(queryClient.getQueryData(previewHistoryKey)).toBeUndefined();
    await vi.waitFor(() => expect(getMyRewards).toHaveBeenCalled());
  });
});
