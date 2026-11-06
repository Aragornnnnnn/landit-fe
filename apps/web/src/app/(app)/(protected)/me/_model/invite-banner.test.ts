// 내 정보 친구 초대 이벤트 띠 문구 테스트 — 친구 몫이 있으면 선물로, 없으면 내 몫으로 부르고 뜻이 끊기는 자리에서 줄을 나눈다
import { describe, expect, it } from 'vitest';

import type { InviteOffer } from '@/features/referral/model/inviter-reward';

import { inviteBannerLinesOf } from './invite-banner';

const offer = (over: Partial<InviteOffer> = {}): InviteOffer => ({
  inviterWon: 1000,
  inviteeWon: 5000,
  progress: null,
  full: false,
  maxWon: 10000,
  ...over,
});

describe('inviteBannerLinesOf', () => {
  it('친구도 받으면 친구에게 주는 것을 앞세우고, 내 몫은 다음 줄에 적는다', () => {
    expect(inviteBannerLinesOf(offer())).toEqual([
      '친구에게 5,000원 선물하고',
      '나도 1,000원 적립',
    ]);
  });

  it('친구 몫이 없으면 내가 받는 금액만 한 줄로 말한다', () => {
    expect(inviteBannerLinesOf(offer({ inviteeWon: 0 }))).toEqual([
      '친구 초대하고 1,000원씩 적립',
    ]);
  });

  it('상한을 채웠고 친구 몫도 없으면 권할 것이 없어 띠를 그리지 않는다', () => {
    expect(
      inviteBannerLinesOf(offer({ full: true, inviteeWon: 0 })),
    ).toBeNull();
  });

  it('상한을 채우면 내 몫은 끝나 친구 선물만 말한다', () => {
    expect(inviteBannerLinesOf(offer({ full: true }))).toEqual([
      '친구에게 5,000원 선물하기',
    ]);
  });
});
