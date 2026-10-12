// 돈통 그림 선택의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  earnedRewardToday,
  endedRewardView,
  rewardCycle,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { potStageOf } from './pot-stage';

const withBalance = (balanceWon: number) =>
  rewardView({ current: rewardCycle({ balanceWon }) });

describe('potStageOf', () => {
  it('쌓인 게 있는데 오늘의 시나리오가 아직이면 기다린다', () => {
    expect(potStageOf(rewardView())).toBe('waiting');
  });

  it('오늘 몫을 받았으면 지킨 그림이다', () => {
    expect(potStageOf(rewardView({ today: earnedRewardToday() }))).toBe('kept');
  });

  it('쌓인 게 없으면 오늘이 아직이어도 빈 통이다', () => {
    expect(potStageOf(withBalance(0))).toBe('empty');
  });

  it('더 받을 몫 없이 다 모았으면 완주 그림이다', () => {
    expect(potStageOf(withBalance(50000))).toBe('complete');
  });

  it('기간을 마쳐 돌려받을 금액이 있으면 완주 그림이다', () => {
    expect(potStageOf(endedRewardView(31920))).toBe('complete');
  });

  it('끝났는데 돌려받을 금액이 없으면 빈 통이다', () => {
    expect(potStageOf(endedRewardView(0))).toBe('empty');
  });

  it('기간을 마친 뒤 검토 중이면 보관된 금액이 있어 지킨 그림이다', () => {
    const view = rewardView({
      state: 'REVIEW',
      current: null,
      today: null,
      heldRefundWon: 31920,
    });

    expect(potStageOf(view)).toBe('kept');
  });

  it('검토 중에는 쌓인 금액이 그대로라 지킨 그림이다', () => {
    expect(potStageOf(rewardView({ state: 'REVIEW', today: null }))).toBe(
      'kept',
    );
  });
});
