// 결제 성공 뒤 서버 유료 상태를 몇 번 다시 묻는다 — RevenueCat 웹훅이 BE에 닿기까지 몇 초 걸린다 (docs/subscription.md 「웹 결제 흐름」)
interface WaitOptions {
  attempts: number;
  intervalMs: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// 기본값 — 최대 10초쯤 (5회 × 2초)
export const PREMIUM_WAIT: WaitOptions = { attempts: 5, intervalMs: 2000 };

export const waitForPremium = async (
  fetchPremium: () => Promise<boolean>,
  { attempts, intervalMs, sleep = defaultSleep }: WaitOptions,
): Promise<boolean> => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    // 한 번의 조회 실패는 "아직 무료"로 본다 — 결제가 실패한 게 아니라 확인이 안 된 것
    const premium = await fetchPremium().catch(() => false);
    if (premium) return true;
    if (attempt < attempts) await sleep(intervalMs);
  }
  return false;
};
