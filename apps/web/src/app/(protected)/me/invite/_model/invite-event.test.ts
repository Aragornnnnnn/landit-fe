// 친구 초대 이벤트 화면 문구 규칙 테스트 — 몇 명 초대했는지와 지금 조건에 따라 제목·진행·버튼이 갈린다
import { describe, expect, it } from 'vitest';

import { inviteEventViewOf, stepRewardsOf } from './invite-event';

const offer = { inviterWon: 1000, inviteeWon: 3000, maxWon: 10000 };

describe('inviteEventViewOf', () => {
  it('친구도 받는 조건이면 둘 다 받는다고 부른다', () => {
    expect(
      inviteEventViewOf({ offer, invitedCount: 0, signupEarnedWon: 0 }).title,
    ).toBe('친구를 초대하면 둘 다 적립금을 받아요');
  });

  it('친구 몫이 없으면 「둘 다」라고 하지 않는다', () => {
    expect(
      inviteEventViewOf({
        offer: { ...offer, inviteeWon: 0 },
        invitedCount: 0,
        signupEarnedWon: 0,
      }).title,
    ).toBe('친구를 초대하면 적립금을 받아요');
  });

  it('아직 아무도 없으면 진행 옆에 받을 수 있는 최대 금액을 적는다', () => {
    const view = inviteEventViewOf({
      offer,
      invitedCount: 0,
      signupEarnedWon: 0,
    });

    expect(view.count).toBe(0);
    expect(view.progressLabel).toBe('최대 10,000원');
  });

  it('초대한 친구가 생기면 받은 금액과 최대 금액을 나란히 적는다', () => {
    const view = inviteEventViewOf({
      offer,
      invitedCount: 5,
      signupEarnedWon: 5000,
    });

    expect(view.count).toBe(5);
    expect(view.progressLabel).toBe('5,000 / 10,000원');
    expect(view.full).toBe(false);
    expect(view.shareLabel).toBe('친구에게 초대 코드 보내기');
  });

  it('초대한 친구는 있는데 내역을 아직 못 받았으면 0원 대신 상한만 적는다', () => {
    expect(
      inviteEventViewOf({ offer, invitedCount: 3, signupEarnedWon: null })
        .progressLabel,
    ).toBe('최대 10,000원');
  });

  it('10명을 채웠어도 덜 들어왔으면 모두 받았다고 하지 않는다', () => {
    const view = inviteEventViewOf({
      offer,
      invitedCount: 10,
      signupEarnedWon: 8000,
    });

    expect(view.fullAllEarned).toBe(false);
    expect(view.fullEarnedWon).toBe(8000);
  });

  it('10명을 다 채우면 다 받았다고 하고, 친구 몫만 남아 선물로 부른다', () => {
    const view = inviteEventViewOf({
      offer,
      invitedCount: 12,
      signupEarnedWon: 10000,
    });

    expect(view.full).toBe(true);
    expect(view.fullAllEarned).toBe(true);
    expect(view.count).toBe(10);
    expect(view.shareLabel).toBe('친구에게 3,000원 선물하기');
  });

  it('10명을 채웠는데 친구 몫도 없으면 그냥 코드를 보낸다', () => {
    expect(
      inviteEventViewOf({
        offer: { ...offer, inviteeWon: 0 },
        invitedCount: 10,
        signupEarnedWon: 10000,
      }).shareLabel,
    ).toBe('친구에게 초대 코드 보내기');
  });
});

describe('stepRewardsOf', () => {
  it('받는 방법 마지막 단계에 나와 친구가 받는 금액을 차례로 적는다', () => {
    expect(stepRewardsOf(offer, false)).toEqual([
      { who: '나', won: 1000 },
      { who: '친구', won: 3000 },
    ]);
  });

  it('10명을 채운 뒤에는 내 몫이 없어 친구 몫만 적는다', () => {
    expect(stepRewardsOf(offer, true)).toEqual([{ who: '친구', won: 3000 }]);
  });

  it('친구 몫이 없는 조건이면 내 몫만 적는다', () => {
    expect(stepRewardsOf({ ...offer, inviteeWon: 0 }, false)).toEqual([
      { who: '나', won: 1000 },
    ]);
  });
});
