// 돈통 그림 선택의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  closedRewardDay,
  earnedRewardToday,
  endedRewardView,
  rewardCycle,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { glowOf, potStageOf } from './pot-stage';

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

describe('glowOf', () => {
  it('쌓인 게 있고 오늘 몫을 받았거나 다 모았으면 금빛이다', () => {
    expect(glowOf('kept')).toBe('gold');
    expect(glowOf('complete')).toBe('gold');
  });

  it('오늘이 아직이면 차분한 빛이다', () => {
    expect(glowOf('waiting')).toBe('calm');
  });

  it('쌓인 게 없으면 빛이 없다', () => {
    expect(glowOf('empty')).toBeNull();
  });
});

describe('potStageOf — 오늘이 아직인 날의 표정', () => {
  const restedTwoDays = rewardView({
    current: rewardCycle({
      days: [closedRewardDay('2026-10-08'), closedRewardDay('2026-10-09')],
    }),
  });

  it('자정이 가까우면 손을 흔들며 재촉한다', () => {
    expect(potStageOf(rewardView(), { urgent: true })).toBe('urgent');
  });

  it('쌓인 게 없는 첫날에도 자정이 가까우면 재촉한다', () => {
    const view = rewardView({ current: rewardCycle({ balanceWon: 0 }) });

    expect(potStageOf(view, { urgent: true })).toBe('urgent');
  });

  it('이틀 넘게 쉬고 있으면 시무룩하다', () => {
    expect(potStageOf(restedTwoDays)).toBe('missed');
  });

  it('하루 쉰 것은 아직 잠자는 그림이다', () => {
    const view = rewardView({
      current: rewardCycle({ days: [closedRewardDay('2026-10-09')] }),
    });

    expect(potStageOf(view)).toBe('waiting');
  });

  it('며칠 쉬었어도 자정이 가까우면 재촉이 먼저다', () => {
    expect(potStageOf(restedTwoDays, { urgent: true })).toBe('urgent');
  });

  it('오늘 몫을 받았으면 자정이 가까워도, 며칠 쉬었어도 지킨 그림이다', () => {
    const view = { ...restedTwoDays, today: earnedRewardToday() };

    expect(potStageOf(view, { urgent: true })).toBe('kept');
  });

  it('재촉과 시무룩은 차분한 빛이다', () => {
    expect(glowOf('urgent')).toBe('calm');
    expect(glowOf('missed')).toBe('calm');
  });
});
