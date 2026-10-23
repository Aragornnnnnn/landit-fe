// 친구 초대 이벤트 화면 문구 규칙 테스트 — 몇 명 초대했는지와 지금 조건·서버 상한에 따라 제목·진행·버튼이 갈린다
import { describe, expect, it } from 'vitest';

import { inviteEventViewOf, stepRewardsOf } from './invite-event';

const offer = {
  inviterWon: 1000,
  inviteeWon: 3000,
  limitCount: 10,
  maxWon: 10000,
};
const unlimited = { ...offer, limitCount: null, maxWon: null };

describe('inviteEventViewOf', () => {
  it('친구도 받는 조건이면 둘 다 받는다고 부른다', () => {
    expect(
      inviteEventViewOf({ offer, invitedCount: 0, earnedWon: 0 }).title,
    ).toBe('친구를 초대하면 둘 다 적립금을 받아요');
  });

  it('친구 몫이 없으면 「둘 다」라고 하지 않는다', () => {
    expect(
      inviteEventViewOf({
        offer: { ...offer, inviteeWon: 0 },
        invitedCount: 0,
        earnedWon: 0,
      }).title,
    ).toBe('친구를 초대하면 적립금을 받아요');
  });

  it('아직 아무도 없으면 진행 옆에 받을 수 있는 최대 금액을 적는다', () => {
    const view = inviteEventViewOf({ offer, invitedCount: 0, earnedWon: 0 });

    expect(view.countLabel).toBe('초대 받은 친구 0/10명');
    expect(view.progressLabel).toBe('최대 10,000원');
    expect(view.ratio).toBe(0);
  });

  it('초대한 친구가 생기면 서버가 준 적립 금액과 최대 금액을 나란히 적는다', () => {
    const view = inviteEventViewOf({ offer, invitedCount: 5, earnedWon: 5000 });

    expect(view.countLabel).toBe('초대 받은 친구 5/10명');
    expect(view.progressLabel).toBe('5,000 / 10,000원');
    expect(view.ratio).toBe(0.5);
    expect(view.shareLabel).toBe('친구에게 초대 코드 보내기');
  });

  it('상한을 채웠어도 덜 들어왔으면 모두 받았다고 하지 않는다', () => {
    const view = inviteEventViewOf({
      offer,
      invitedCount: 10,
      earnedWon: 8000,
    });

    expect(view.full).toBe(true);
    expect(view.fullAllEarned).toBe(false);
  });

  it('상한을 다 채우면 다 받았다고 하고, 친구 몫만 남아 선물로 부른다', () => {
    const view = inviteEventViewOf({
      offer,
      invitedCount: 12,
      earnedWon: 10000,
    });

    expect(view.full).toBe(true);
    expect(view.fullAllEarned).toBe(true);
    expect(view.count).toBe(10);
    expect(view.shareLabel).toBe('친구에게 3,000원 선물하기');
  });

  it('상한이 없으면 막대·최대 금액 없이 초대한 친구 수만 적고 다 찼다고 하지 않는다', () => {
    const view = inviteEventViewOf({
      offer: unlimited,
      invitedCount: 12,
      earnedWon: 12000,
    });

    expect(view.countLabel).toBe('초대 받은 친구 12명');
    expect(view.ratio).toBeNull();
    expect(view.progressLabel).toBeNull();
    expect(view.full).toBe(false);
  });
});

describe('stepRewardsOf', () => {
  it('받는 방법 마지막 단계에 나와 친구가 받는 금액을 차례로 적는다', () => {
    expect(stepRewardsOf(offer, false)).toEqual([
      { who: '나', won: 1000 },
      { who: '친구', won: 3000 },
    ]);
  });

  it('상한을 채운 뒤에는 내 몫이 없어 친구 몫만 적는다', () => {
    expect(stepRewardsOf(offer, true)).toEqual([{ who: '친구', won: 3000 }]);
  });

  it('친구 몫이 없는 조건이면 내 몫만 적는다', () => {
    expect(stepRewardsOf({ ...offer, inviteeWon: 0 }, false)).toEqual([
      { who: '나', won: 1000 },
    ]);
  });
});
