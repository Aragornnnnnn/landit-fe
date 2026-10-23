// 환급 화면 초대 띠 문구 테스트 — 환급을 보러 온 사람을 붙잡는 한 줄이라 초대로 더 받을 수 있는 금액만 말한다
import { describe, expect, it } from 'vitest';

import type { InviteOffer } from '@/features/referral/model/inviter-reward';

import { inviteBandOf } from './invite-band';

const offer = (over: Partial<InviteOffer> = {}): InviteOffer => ({
  inviterWon: 1000,
  inviteeWon: 5000,
  progress: { kind: 'count', used: 0, total: 10 },
  maxWon: 10000,
  full: false,
  ...over,
});

describe('inviteBandOf', () => {
  it('최대 금액을 알면 초대로 더 받을 수 있는 최대 금액을 적고, 아직 아무도 없어도 빈 게이지를 둔다', () => {
    expect(inviteBandOf(offer())).toEqual({
      lead: '친구 초대하고 최대 ',
      amount: '10,000원',
      tail: ' 추가 적립',
      ratio: 0,
    });
  });

  it('초대 받은 친구가 생기면 서버 상한 진행만큼 게이지를 채운다', () => {
    expect(
      inviteBandOf(offer({ progress: { kind: 'count', used: 4, total: 10 } })),
    ).toMatchObject({ lead: '친구 초대하고 최대 ', ratio: 0.4 });
  });

  it('금액 상한이면 서버 지급액으로 게이지를 채운다', () => {
    expect(
      inviteBandOf(
        offer({ progress: { kind: 'amount', used: 3000, total: 10000 } }),
      )?.ratio,
    ).toBe(0.3);
  });

  it('최대 금액을 모르면(무제한·결제 보상이 섞임) 한 명당 금액을 적고 채울 끝이 없어 게이지를 그리지 않는다', () => {
    expect(inviteBandOf(offer({ maxWon: null, progress: null }))).toEqual({
      lead: '친구 초대하고 ',
      amount: '1,000원',
      tail: '씩 추가 적립',
      ratio: null,
    });
  });

  it('상한을 채우면 친구 몫만 남아 선물로 부르고, 게이지는 꽉 찬 채로 둔다', () => {
    expect(
      inviteBandOf(
        offer({ full: true, progress: { kind: 'count', used: 12, total: 10 } }),
      ),
    ).toEqual({
      lead: '친구에게 ',
      amount: '5,000원',
      tail: ' 선물하기',
      ratio: 1,
    });
  });

  it('상한을 채웠고 친구 몫도 없으면 띠를 그리지 않는다', () => {
    expect(inviteBandOf(offer({ full: true, inviteeWon: 0 }))).toBeNull();
  });
});
