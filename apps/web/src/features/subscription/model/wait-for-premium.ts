// 결제 성공 뒤 서버가 유료로 바뀌기를 몇 번 다시 묻는다 — RevenueCat 웹훅이 BE에 닿기까지 몇 초 걸린다 (docs/subscription.md 「웹 결제 흐름」)
import type { MySubscription } from '../api/subscription';

export interface WaitOptions {
  /** 최대 조회 횟수 */
  attempts: number;
  /** 조회 사이에 쉬는 시간 */
  intervalMs: number;
  /** 테스트가 실제 시간을 쓰지 않게 바꿔 끼우는 자리 */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 기본값 — 최대 10초쯤 (5회 × 2초) */
export const PREMIUM_WAIT: WaitOptions = { attempts: 5, intervalMs: 2000 };

/**
 * 구독 조회를 반복해 premium이 켜진 응답을 기다린다.
 *
 * 한 번의 조회 실패는 "아직 무료"로 본다 — 결제가 실패한 게 아니라 확인이 안 된 것이다.
 *
 * @returns 유료로 확인된 구독 응답. 정해진 횟수를 다 물어도 무료면 null
 */
export const waitForPremium = async (
  fetchSubscription: () => Promise<MySubscription>,
  { attempts, intervalMs, sleep = defaultSleep }: WaitOptions,
): Promise<MySubscription | null> => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const subscription = await fetchSubscription().catch(() => null);
    if (subscription?.premium) return subscription;
    if (attempt < attempts) await sleep(intervalMs);
  }
  return null;
};
