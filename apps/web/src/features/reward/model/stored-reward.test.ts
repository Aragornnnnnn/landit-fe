// 결제 전에 보관 중인 적립금 규칙 테스트
import { describe, expect, it } from 'vitest';

import type { RewardView } from '../api/reward';
import {
  closedRewardDay,
  earnedRewardToday,
  rewardCycle,
  rewardView,
} from './reward.fixture';
import { carriedRewardWonOf, storedRewardWonOf } from './stored-reward';

describe('storedRewardWonOf', () => {
  it('환급을 시작하지 않은 사람에게 쌓인 돈이 있으면 그 금액이다', () => {
    const view = rewardView({ state: 'NONE', current: null, balanceWon: 3000 });

    expect(storedRewardWonOf(view)).toBe(3000);
  });

  it('쌓는 중인 참여자는 0이다 — 참여자는 환급 화면이 금액을 이미 말한다', () => {
    const view = rewardView({ state: 'ACTIVE', balanceWon: 8000 });

    expect(storedRewardWonOf(view)).toBe(0);
  });

  it.each(['PENDING', 'REVIEW', 'ENDED'] as const)(
    '%s처럼 환급을 산 적이 있는 사람은 0이다 — 잔액에 지난 회차 학습분이 섞일 수 있다',
    (state) => {
      const view = rewardView({ state, current: null, balanceWon: 3000 });

      expect(storedRewardWonOf(view)).toBe(0);
    },
  );

  it('음수로 와도 0이다', () => {
    const view = rewardView({ state: 'NONE', current: null, balanceWon: -500 });

    expect(storedRewardWonOf(view)).toBe(0);
  });

  it('이 필드를 모르는 옛 서버면 0이다', () => {
    const view: RewardView = rewardView({ state: 'NONE', current: null });
    delete view.balanceWon;

    expect(storedRewardWonOf(view)).toBe(0);
  });
});

describe('carriedRewardWonOf', () => {
  it('회차 잔액에서 날마다 학습으로 받은 몫을 뺀 만큼이 결제 전 몫이다', () => {
    const cycle = rewardCycle({
      balanceWon: 8500,
      days: [closedRewardDay('2026-10-10', true)],
    });

    expect(carriedRewardWonOf(cycle, null)).toBe(8000);
  });

  it('날짜별 내역이 없으면 오늘 받은 몫만 뺀다', () => {
    const cycle = rewardCycle({ balanceWon: 500, days: [] });

    expect(carriedRewardWonOf(cycle, earnedRewardToday())).toBe(0);
  });
});
