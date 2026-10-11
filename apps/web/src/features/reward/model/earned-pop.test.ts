// 받은 금액 알림 상태의 계약 테스트
import { beforeEach, describe, expect, it } from 'vitest';

import type { RewardReceipt } from '../api/reward';
import { useEarnedPop } from './earned-pop';
import { rewardReceipt } from './reward.fixture';

const receipt = (patch: Partial<RewardReceipt> = {}) =>
  rewardReceipt({
    completionId: 7,
    activityType: 'EXPRESSION',
    earnedWon: 11,
    ...patch,
  });

beforeEach(() => useEarnedPop.setState({ shown: null, announced: [] }));

describe('useEarnedPop', () => {
  it('받은 금액이 있으면 띄운다', () => {
    useEarnedPop.getState().show(receipt());

    expect(useEarnedPop.getState().shown).toEqual({
      completionId: 7,
      earnedWon: 11,
    });
  });

  it.each([
    ['NO_ADDITIONAL_REWARD', 0],
    ['PENDING', null],
  ] as const)('%s 영수증은 띄우지 않는다', (status, earnedWon) => {
    useEarnedPop.getState().show(receipt({ status, earnedWon }));

    expect(useEarnedPop.getState().shown).toBeNull();
  });

  it('이미 알린 완료는 걷힌 뒤에 다시 와도 띄우지 않는다', () => {
    // given — 같은 표현을 다시 끝내면 서버가 처음 영수증을 그대로 준다
    useEarnedPop.getState().show(receipt());
    useEarnedPop.getState().clear();

    useEarnedPop.getState().show(receipt());

    expect(useEarnedPop.getState().shown).toBeNull();
  });

  it('다음 표현을 끝내면 새 금액으로 바뀐다', () => {
    useEarnedPop.getState().show(receipt());
    useEarnedPop.getState().show(receipt({ completionId: 8, earnedWon: 77 }));

    expect(useEarnedPop.getState().shown?.earnedWon).toBe(77);
  });
});
