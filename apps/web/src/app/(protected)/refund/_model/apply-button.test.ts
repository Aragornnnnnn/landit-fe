// 환급 신청 버튼 문구의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  endedRewardView,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { applyButtonOf } from './apply-button';

const offCycle = { current: null, today: null, remainingDays: null };

describe('applyButtonOf', () => {
  it('쌓는 중에는 며칠 뒤에 신청할 수 있는지 말한다', () => {
    expect(applyButtonOf(rewardView({ remainingDays: 173 }))).toEqual({
      open: false,
      label: '173일 뒤 환급 신청할 수 있어요',
    });
  });

  it('기간을 마친 금액이 있으면 그 금액으로 신청을 연다', () => {
    expect(applyButtonOf(endedRewardView(31920))).toEqual({
      open: true,
      label: '31,920원 환급 신청하기',
    });
  });

  it('새 회차를 쌓는 중이어도 지난 회차의 금액은 신청할 수 있다', () => {
    expect(applyButtonOf(rewardView({ pendingRefundWon: 31920 })).open).toBe(
      true,
    );
  });

  it('끝났는데 돌려받을 금액이 없으면 그렇게 말한다', () => {
    expect(applyButtonOf(endedRewardView(0))).toEqual({
      open: false,
      label: '환급 신청할 금액이 없어요',
    });
  });

  it.each(['PENDING', 'REVIEW'] as const)(
    '%s 국면에서는 확인이 끝나야 신청할 수 있다고 말한다',
    (state) => {
      expect(applyButtonOf(rewardView({ state, ...offCycle }))).toEqual({
        open: false,
        label: '확인이 끝나면 환급 신청할 수 있어요',
      });
    },
  );
});
