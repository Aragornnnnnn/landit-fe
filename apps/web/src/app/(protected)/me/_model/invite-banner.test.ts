// 내 정보 친구 초대 이벤트 띠 문구 테스트 — 친구 몫이 있으면 선물로, 없으면 내 몫으로 부른다
import { describe, expect, it } from 'vitest';

import { inviteBannerLineOf } from './invite-banner';

describe('inviteBannerLineOf', () => {
  it('친구도 받으면 친구에게 주는 것을 앞세운다', () => {
    expect(
      inviteBannerLineOf({ inviterWon: 1000, inviteeWon: 3000, maxWon: 10000 }),
    ).toBe('친구에게 3,000원 선물하고 나도 1,000원 받기');
  });

  it('친구 몫이 없으면 내가 받는 금액만 말한다', () => {
    expect(
      inviteBannerLineOf({ inviterWon: 1000, inviteeWon: 0, maxWon: 10000 }),
    ).toBe('친구 초대하고 1,000원씩 받기');
  });
});
