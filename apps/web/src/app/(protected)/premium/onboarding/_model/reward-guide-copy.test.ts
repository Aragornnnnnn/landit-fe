// 결제 직후 환급 안내를 보여 줄지와 거기 적을 글자의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  earnedRewardToday,
  endedRewardView,
  rewardCycle,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { rewardGuideCopyOf } from './reward-guide-copy';

const offCycle = { current: null, today: null, remainingDays: null };

describe('rewardGuideCopyOf', () => {
  it('챌린지를 산 사람에게는 그 상품이 돌려주는 금액·기간과 하루 몫을 말한다', () => {
    const view = rewardView({
      current: rewardCycle({
        maximumWon: 30_000,
        balanceWon: 0,
        eligibleDays: 100,
      }),
    });

    expect(rewardGuideCopyOf(view)).toEqual({
      eyebrow: '오늘부터 챌린지 시작!',
      amount: '최대 30,000원',
      caption: '100일 동안 모은 만큼 돌려받아요',
      startNote: null,
      dailyWon: 300,
      confirmed: true,
    });
  });

  it('결제 전에 받아 둔 돈(초대 보상 등)이 회차에 합쳐졌으면 그 금액부터 시작한다고 말한다', () => {
    const view = rewardView({
      current: rewardCycle({ balanceWon: 8000, days: [] }),
      today: null,
    });

    expect(rewardGuideCopyOf(view)?.startNote).toBe('8,000원부터 시작해요');
  });

  it('결제 당일 끝낸 오늘의 시나리오 몫만 들어 있으면 시작 금액으로 치지 않는다', () => {
    const view = rewardView({
      current: rewardCycle({ balanceWon: 500, days: [] }),
      today: earnedRewardToday(),
    });

    expect(rewardGuideCopyOf(view)?.startNote).toBeNull();
  });

  it('며칠 지나 남은 날이 줄어도 상품의 전체 기간으로 말한다', () => {
    const view = rewardView({
      current: rewardCycle({ eligibleDays: 100 }),
      remainingDays: 80,
    });

    expect(rewardGuideCopyOf(view)?.caption).toBe(
      '100일 동안 모은 만큼 돌려받아요',
    );
  });

  it('결제를 확인하는 중이면 금액을 단정하지 않고 규칙만 말한다', () => {
    // given — 결제는 끝났는데 환급 쪽 반영이 늦다. 얼마짜리를 샀는지 아직 모른다
    const view = rewardView({ state: 'PENDING', ...offCycle });

    expect(rewardGuideCopyOf(view)).toEqual({
      eyebrow: '오늘부터 챌린지 시작!',
      amount: '환급 챌린지',
      caption: '오늘의 시나리오를 한 날마다 쌓이고, 모은 만큼 돌려받아요',
      startNote: null,
      dailyWon: null,
      confirmed: false,
    });
  });

  it('쌓는 중이라는데 도는 회차가 오지 않았으면 보여 주지 않는다', () => {
    expect(rewardGuideCopyOf(rewardView({ current: null }))).toBe(null);
  });

  it('환급과 상관없는 상품을 샀으면 보여 주지 않는다', () => {
    expect(rewardGuideCopyOf(rewardView({ state: 'NONE', ...offCycle }))).toBe(
      null,
    );
  });

  it('지난 회차만 남은 사람이 다른 상품을 샀으면 보여 주지 않는다', () => {
    expect(rewardGuideCopyOf(endedRewardView(31920))).toBe(null);
  });

  it('환급을 받지 못했으면 보여 주지 않는다', () => {
    expect(rewardGuideCopyOf(null)).toBe(null);
  });
});
