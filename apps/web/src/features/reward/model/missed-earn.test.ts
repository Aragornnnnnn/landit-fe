// 받을 수 있었던 금액 표시의 계약 — 누구의 것인지 가르고, 바뀌면 알린다
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearMissedEarn,
  hasMissedEarn,
  markMissedEarn,
  subscribeMissedEarn,
} from './missed-earn';

afterEach(clearMissedEarn);

describe('missed-earn', () => {
  it('표시해 둔 사람에게만 있다고 답한다 — 다른 계정이 끝낸 대화는 내 것이 아니다', () => {
    markMissedEarn(7);

    expect(hasMissedEarn(7)).toBe(true);
    expect(hasMissedEarn(8)).toBe(false);
  });

  it('지우면 없다고 답한다', () => {
    markMissedEarn(7);

    clearMissedEarn();

    expect(hasMissedEarn(7)).toBe(false);
  });

  it('표시하거나 지울 때 지켜보는 쪽에 알린다 — 같은 값을 다시 적으면 알리지 않는다', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMissedEarn(listener);

    markMissedEarn(7);
    markMissedEarn(7);
    clearMissedEarn();
    unsubscribe();
    markMissedEarn(7);

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
