// 결제 전에 보관 중인 적립금 규칙 테스트
import { describe, expect, it } from 'vitest';

import type { RewardView } from '../api/reward';
import { rewardView } from './reward.fixture';
import { storedRewardBadgeOf, storedRewardWonOf } from './stored-reward';

describe('storedRewardWonOf', () => {
  it('환급을 시작하지 않은 사람에게 쌓인 돈이 있으면 그 금액이다', () => {
    const view = rewardView({ state: 'NONE', current: null, balanceWon: 3000 });

    expect(storedRewardWonOf(view)).toBe(3000);
  });

  it('쌓는 중인 참여자는 0이다 — 참여자는 환급 화면이 금액을 이미 말한다', () => {
    const view = rewardView({ state: 'ACTIVE', balanceWon: 8000 });

    expect(storedRewardWonOf(view)).toBe(0);
  });

  it('이 필드를 모르는 옛 서버면 0이다', () => {
    const view: RewardView = rewardView({ state: 'NONE', current: null });
    delete view.balanceWon;

    expect(storedRewardWonOf(view)).toBe(0);
  });
});

describe('storedRewardBadgeOf', () => {
  it('보관 중인 금액을 쌓인 환급액으로 말한다', () => {
    expect(storedRewardBadgeOf(3000)).toEqual({
      label: '쌓인 환급액',
      amountWon: 3000,
      note: '시작하면 돌려받아요',
      mood: 'kept',
    });
  });
});
