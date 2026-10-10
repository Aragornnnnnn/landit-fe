// 결제 직후 환급 안내를 보여 줄지와 거기 적을 글자의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  endedRewardView,
  rewardCycle,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { refundGuideCopyOf } from './refund-guide-copy';

const offCycle = { current: null, today: null, remainingDays: null };

describe('refundGuideCopyOf', () => {
  it('환급 상품을 산 사람에게는 그 상품이 돌려주는 금액과 기간을 말한다', () => {
    const view = rewardView({
      current: rewardCycle({ maximumWon: 31920, balanceWon: 0 }),
      remainingDays: 92,
    });

    expect(refundGuideCopyOf(view)).toEqual({
      eyebrow: '오늘부터 챌린지 시작!',
      amount: '최대 31,920원',
      caption: '92일 동안 매일 공부하면 구독료를 돌려받아요',
    });
  });

  it('남은 날을 모르면 기간 없이 말한다', () => {
    const view = rewardView({ remainingDays: null });

    expect(refundGuideCopyOf(view)?.caption).toBe(
      '매일 공부하면 구독료를 돌려받아요',
    );
  });

  it('결제를 확인하는 중이면 금액을 단정하지 않고 두 상품을 같이 말한다', () => {
    // given — 결제는 끝났는데 환급 쪽 반영이 늦다. 어느 상품인지 아직 모른다
    const view = rewardView({ state: 'PENDING', ...offCycle });

    expect(refundGuideCopyOf(view)).toEqual({
      eyebrow: '매일 공부하면 수강료를 돌려받아요',
      amount: '환급 챌린지 시작',
      caption: '6개월은 낸 금액 전부, 3개월은 80%를 돌려받아요',
    });
  });

  it('쌓는 중이라는데 도는 회차가 오지 않았으면 보여 주지 않는다', () => {
    expect(refundGuideCopyOf(rewardView({ current: null }))).toBe(null);
  });

  it('환급과 상관없는 상품을 샀으면 보여 주지 않는다', () => {
    expect(refundGuideCopyOf(rewardView({ state: 'NONE', ...offCycle }))).toBe(
      null,
    );
  });

  it('지난 회차만 남은 사람이 다른 상품을 샀으면 보여 주지 않는다', () => {
    expect(refundGuideCopyOf(endedRewardView(31920))).toBe(null);
  });

  it('환급을 받지 못했으면 보여 주지 않는다', () => {
    expect(refundGuideCopyOf(null)).toBe(null);
  });
});
