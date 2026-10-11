// 환급 신청 버튼 문구의 계약 테스트
import { describe, expect, it } from 'vitest';

import {
  endedRewardView,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { applyButtonLabelOf } from './apply-button';

const offCycle = { current: null, today: null, remainingDays: null };

describe('applyButtonLabelOf', () => {
  it('쌓는 중에는 며칠 뒤에 신청할 수 있는지 말한다', () => {
    expect(applyButtonLabelOf(rewardView({ remainingDays: 173 }))).toBe(
      '173일 뒤 환급 신청할 수 있어요',
    );
  });

  it('기간을 마친 금액이 있으면 그 금액과 곧 열린다는 걸 말한다', () => {
    // given — 신청 방법이 정해지기 전이라 누를 수 있는 것처럼 말하지 않는다
    expect(applyButtonLabelOf(endedRewardView(31920))).toBe(
      '31,920원 · 곧 환급 신청할 수 있어요',
    );
  });

  it('새 회차를 쌓는 중이어도 지난 회차의 금액을 먼저 말한다', () => {
    expect(applyButtonLabelOf(rewardView({ pendingRefundWon: 31920 }))).toBe(
      '31,920원 · 곧 환급 신청할 수 있어요',
    );
  });

  it('끝났는데 돌려받을 금액이 없으면 그렇게 말한다', () => {
    expect(applyButtonLabelOf(endedRewardView(0))).toBe(
      '환급 신청할 금액이 없어요',
    );
  });

  it.each(['PENDING', 'REVIEW'] as const)(
    '%s 국면에서는 확인이 끝나야 신청할 수 있다고 말한다',
    (state) => {
      expect(applyButtonLabelOf(rewardView({ state, ...offCycle }))).toBe(
        '확인이 끝나면 환급 신청할 수 있어요',
      );
    },
  );
});
