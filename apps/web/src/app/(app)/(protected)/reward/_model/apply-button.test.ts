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
    expect(applyButtonLabelOf(rewardView({ remainingDays: 91 }))).toBe(
      '91일 뒤 환급 신청할 수 있어요',
    );
  });

  it('출금할 수 있는 금액이 있으면 그 금액과 곧 열린다는 걸 말한다', () => {
    // given — 신청 방법이 정해지기 전이라 누를 수 있는 것처럼 말하지 않는다
    expect(applyButtonLabelOf(endedRewardView(32000))).toBe(
      '32,000원 · 곧 환급 신청할 수 있어요',
    );
  });

  it('새 챌린지를 쌓는 중이어도 지난 챌린지의 출금할 금액을 먼저 말한다', () => {
    const view = rewardView({
      withdrawableWon: 32000,
      withdrawalAvailable: true,
    });

    expect(applyButtonLabelOf(view)).toBe(
      '32,000원 · 곧 환급 신청할 수 있어요',
    );
  });

  it('금액은 출금할 수 있는 금액을 적는다 — 보존된 예정액과 다르면 예정액을 적지 않는다', () => {
    const view = {
      ...endedRewardView(32000),
      withdrawableWon: 30000,
    };

    expect(applyButtonLabelOf(view)).toBe(
      '30,000원 · 곧 환급 신청할 수 있어요',
    );
  });

  it('끝났고 남은 금액이 있는데 아직 출금할 수 없으면 없다고 하지 않고 확인을 기다리라고 말한다', () => {
    const view = {
      ...endedRewardView(32000),
      withdrawableWon: 0,
      withdrawalAvailable: false,
    };

    expect(applyButtonLabelOf(view)).toBe(
      '확인이 끝나면 환급 신청할 수 있어요',
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
