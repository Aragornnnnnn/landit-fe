// 100일 이용권을 지금 살 수 있는지 서버에 새로 묻는다 — 스토어는 이용 기간이 남아 있어도 같은 이용권을 다시 팔아서, 결제 직전에 우리가 막아야 한다
import { getMyRewards } from '@/features/reward/api/reward';
import type { PassAvailability } from '@/features/subscription/model/purchase/usePurchase';

// 이 시간 안에 답이 없으면 알 수 없는 것으로 친다 — 결제 버튼을 오래 잠가 두지 않는다
const CHECK_TIMEOUT_MS = 8_000;

const timeout = (ms: number) =>
  new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));

/**
 * 이용권을 지금 살 수 있는지 묻는다. 받아 둔 환급은 방금 한 결제를 모르므로 쓰지 않고 매번 새로 받는다.
 *
 * @returns 서버가 살 수 있다고 분명히 답했을 때만 `available`. 던지지 않는다
 */
export const checkPassAvailability = async (): Promise<PassAvailability> => {
  try {
    const reward = await Promise.race([
      getMyRewards(),
      timeout(CHECK_TIMEOUT_MS),
    ]);
    if (typeof reward?.purchaseAvailable !== 'boolean') return 'unknown';
    return reward.purchaseAvailable ? 'available' : 'unavailable';
  } catch {
    return 'unknown';
  }
};
