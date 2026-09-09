// 결제 성공 뒤 서버에 유료 상태가 반영되기를 기다리는 규칙 — 웹훅 지연 몇 초를 감안해 몇 번 다시 묻는다
import { describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '../api/subscription';
import { waitForPremium } from './wait-for-premium';

const noSleep = () => Promise.resolve();
const subscription = (premium: boolean): MySubscription => ({
  premium,
  subscriptionStatus: premium ? 'ACTIVE' : 'NONE',
  periodType: null,
  expiresAt: null,
});

describe('waitForPremium', () => {
  it('처음부터 유료면 한 번만 묻고 그 응답을 돌려준다', async () => {
    const fetchSubscription = vi.fn().mockResolvedValue(subscription(true));

    await expect(
      waitForPremium(fetchSubscription, {
        attempts: 5,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toEqual(subscription(true));
    expect(fetchSubscription).toHaveBeenCalledTimes(1);
  });

  it('몇 번 만에 유료로 바뀌면 그때 끝낸다', async () => {
    const fetchSubscription = vi
      .fn()
      .mockResolvedValueOnce(subscription(false))
      .mockResolvedValueOnce(subscription(false))
      .mockResolvedValueOnce(subscription(true));

    await expect(
      waitForPremium(fetchSubscription, {
        attempts: 5,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toEqual(subscription(true));
    expect(fetchSubscription).toHaveBeenCalledTimes(3);
  });

  it('정해진 횟수를 다 물어도 무료면 포기한다 — 웹훅이 늦는 것이지 결제가 실패한 게 아니다', async () => {
    const fetchSubscription = vi.fn().mockResolvedValue(subscription(false));

    await expect(
      waitForPremium(fetchSubscription, {
        attempts: 3,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toBeNull();
    expect(fetchSubscription).toHaveBeenCalledTimes(3);
  });

  it('조회가 실패한 시도는 무료로 보고 계속 묻는다', async () => {
    const fetchSubscription = vi
      .fn()
      .mockRejectedValueOnce(new Error('네트워크'))
      .mockResolvedValueOnce(subscription(true));

    await expect(
      waitForPremium(fetchSubscription, {
        attempts: 3,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toEqual(subscription(true));
  });

  it('시도 사이에만 쉰다 — 마지막 시도 뒤에는 기다리지 않는다', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetchSubscription = vi.fn().mockResolvedValue(subscription(false));

    await waitForPremium(fetchSubscription, {
      attempts: 3,
      intervalMs: 2000,
      sleep,
    });

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
  });
});
