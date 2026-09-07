// 결제 성공 뒤 서버에 유료 상태가 반영되기를 기다리는 규칙 — 웹훅 지연 몇 초를 감안해 몇 번 다시 묻는다
import { describe, expect, it, vi } from 'vitest';

import { waitForPremium } from './wait-for-premium';

const noSleep = () => Promise.resolve();

describe('waitForPremium', () => {
  it('처음부터 유료면 한 번만 묻고 끝낸다', async () => {
    const fetchPremium = vi.fn().mockResolvedValue(true);

    await expect(
      waitForPremium(fetchPremium, {
        attempts: 5,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toBe(true);
    expect(fetchPremium).toHaveBeenCalledTimes(1);
  });

  it('몇 번 만에 유료로 바뀌면 그때 끝낸다', async () => {
    const fetchPremium = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await expect(
      waitForPremium(fetchPremium, {
        attempts: 5,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toBe(true);
    expect(fetchPremium).toHaveBeenCalledTimes(3);
  });

  it('정해진 횟수를 다 물어도 무료면 포기한다 — 웹훅이 늦는 것이지 결제가 실패한 게 아니다', async () => {
    const fetchPremium = vi.fn().mockResolvedValue(false);

    await expect(
      waitForPremium(fetchPremium, {
        attempts: 3,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toBe(false);
    expect(fetchPremium).toHaveBeenCalledTimes(3);
  });

  it('조회가 실패한 시도는 무료로 보고 계속 묻는다', async () => {
    const fetchPremium = vi
      .fn()
      .mockRejectedValueOnce(new Error('네트워크'))
      .mockResolvedValueOnce(true);

    await expect(
      waitForPremium(fetchPremium, {
        attempts: 3,
        intervalMs: 0,
        sleep: noSleep,
      }),
    ).resolves.toBe(true);
  });

  it('시도 사이에만 쉰다 — 마지막 시도 뒤에는 기다리지 않는다', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetchPremium = vi.fn().mockResolvedValue(false);

    await waitForPremium(fetchPremium, {
      attempts: 3,
      intervalMs: 2000,
      sleep,
    });

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
  });
});
