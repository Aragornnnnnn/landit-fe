// 돈통 그림 선택의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  endedRewardView,
  rewardCycle,
  rewardToday,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { potArtOf, potStageOf } from './pot-stage';

const withBalance = (balanceWon: number) =>
  rewardView({ current: rewardCycle({ balanceWon }) });

describe('potStageOf', () => {
  it('쌓인 게 있는데 오늘이 아직이면 기다린다', () => {
    expect(potStageOf(rewardView())).toBe('waiting');
  });

  it('오늘 하나라도 했으면 지킨 그림이다', () => {
    expect(
      potStageOf(rewardView({ today: rewardToday({ earnedWon: 111 }) })),
    ).toBe('kept');
  });

  it('어제 쉬어서 0원이 됐으면 잃은 그림이다', () => {
    expect(potStageOf({ ...withBalance(0), lostYesterdayWon: 1107 })).toBe(
      'lost',
    );
  });

  it('처음이라 0원이면 빈 통이다', () => {
    expect(potStageOf(withBalance(0))).toBe('empty');
  });

  it('더 받을 몫 없이 다 모았으면 완주 그림이다', () => {
    expect(potStageOf(withBalance(59900))).toBe('complete');
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

describe('potArtOf', () => {
  it('오늘이 아직이어도 낮에는 잠자는 그림이다', () => {
    expect(potArtOf('waiting', false)).toBe('sleeping');
  });

  it('자정이 가까우면 다급한 그림이다', () => {
    expect(potArtOf('waiting', true)).toBe('waiting');
  });

  it('그 밖에는 고른 그림 그대로다', () => {
    expect(potArtOf('kept', false)).toBe('kept');
  });
});
