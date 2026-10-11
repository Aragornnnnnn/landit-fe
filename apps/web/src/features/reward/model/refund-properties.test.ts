// 환급 유저 속성 — 참여 여부와 국면이 프로필에 맞게 올라가는지
import { describe, expect, it } from 'vitest';

import { toRefundProperties } from './refund-properties';
import { endedRewardView, rewardView } from './reward.fixture';

describe('toRefundProperties', () => {
  it('참여한 적이 없으면 none이다', () => {
    expect(toRefundProperties(null)).toEqual({
      reward_state: 'none',
    });
  });

  it.each([
    ['쌓는 중', rewardView(), 'active'],
    ['기간이 끝남', endedRewardView(31_920), 'ended'],
    ['결제 확인 중', rewardView({ state: 'PENDING' }), 'pending'],
    ['검토 중', rewardView({ state: 'REVIEW' }), 'review'],
  ])('%s이면 그 국면을 올린다', (_case, reward, state) => {
    expect(toRefundProperties(reward)).toEqual({
      reward_state: state,
    });
  });
});
