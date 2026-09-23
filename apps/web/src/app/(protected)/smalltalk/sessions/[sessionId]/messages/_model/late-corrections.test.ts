// 폴링으로 뒤늦게 온 교정 카드만 떠오르게 한다 — 들어올 때 이미 있던 교정은 그냥 그린다
import { describe, expect, it } from 'vitest';

import type { SmallTalkHistoryMessage } from '@/features/small-talk/api/small-talk';

import { waitedCorrectionIds } from './late-corrections';

const message = (
  messageId: number,
  correctionStatus?: SmallTalkHistoryMessage['correctionStatus'],
): SmallTalkHistoryMessage =>
  ({ messageId, role: 'USER', correctionStatus }) as SmallTalkHistoryMessage;

describe('waitedCorrectionIds', () => {
  it('들어올 때 이미 교정이 있던 말풍선은 기다린 적이 없다', () => {
    const waited = waitedCorrectionIds(new Set(), [
      message(1, 'COMPLETED'),
      message(2, 'COMPLETED'),
    ]);

    expect(waited.size).toBe(0);
  });

  it('만드는 중이던 말풍선은 기다린 것으로 기억한다', () => {
    const waited = waitedCorrectionIds(new Set(), [
      message(1, 'COMPLETED'),
      message(2, 'PREPARING'),
    ]);

    expect([...waited]).toEqual([2]);
  });

  it('교정이 도착해 상태가 바뀌어도 기다렸던 것은 잊지 않는다', () => {
    // 잊으면 도착하는 순간 애니메이션이 붙을 자리를 놓친다
    const waiting = waitedCorrectionIds(new Set(), [message(2, 'PREPARING')]);

    const arrived = waitedCorrectionIds(waiting, [message(2, 'COMPLETED')]);

    expect(arrived.has(2)).toBe(true);
  });

  it('새로 기다릴 것이 없으면 같은 집합을 돌려준다', () => {
    const waited = waitedCorrectionIds(new Set(), [message(1, 'COMPLETED')]);

    expect(waitedCorrectionIds(waited, [message(1, 'COMPLETED')])).toBe(waited);
  });
});
