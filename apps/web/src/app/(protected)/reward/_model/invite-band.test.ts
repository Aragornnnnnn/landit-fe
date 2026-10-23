// 환급 화면 초대 띠 문구 테스트 — 아직 아무도 없으면 최대 금액을, 생기면 서버 상한 진행을 오른쪽에 적는다
import { describe, expect, it } from 'vitest';

import type { InviteOffer } from '@/features/referral/model/inviter-reward';

import { inviteBandOf } from './invite-band';

const offer = (over: Partial<InviteOffer> = {}): InviteOffer => ({
  inviterWon: 1000,
  inviteeWon: 3000,
  progress: { kind: 'count', used: 0, total: 10 },
  maxWon: 10000,
  full: false,
  ...over,
});

describe('inviteBandOf', () => {
  it('아직 초대한 친구가 없으면 받을 수 있는 최대 금액을 줄여 적고 막대는 비운다', () => {
    expect(inviteBandOf({ offer: offer(), invitedCount: 0 })).toEqual({
      inviterWon: 1000,
      sideLabel: '최대 1만원',
      ratio: 0,
    });
  });

  it('인원 상한이면 서버 등록 수로 몇 명째인지 적고 그만큼 막대를 채운다', () => {
    expect(
      inviteBandOf({
        offer: offer({ progress: { kind: 'count', used: 2, total: 10 } }),
        invitedCount: 2,
      }),
    ).toMatchObject({ sideLabel: '2/10명', ratio: 0.2 });
  });

  it('상한을 넘겨도 띠는 남고 막대는 꽉 찬 데서 멈춘다', () => {
    expect(
      inviteBandOf({
        offer: offer({
          progress: { kind: 'count', used: 12, total: 10 },
          full: true,
        }),
        invitedCount: 12,
      }),
    ).toMatchObject({ sideLabel: '10/10명', ratio: 1 });
  });

  it('금액 상한이면 서버 지급액으로 진행을 적는다', () => {
    expect(
      inviteBandOf({
        offer: offer({
          progress: { kind: 'amount', used: 4000, total: 10000 },
        }),
        invitedCount: 4,
      }),
    ).toMatchObject({ sideLabel: '4,000원 / 1만원', ratio: 0.4 });
  });

  it('상한이 없으면 막대 없이 초대한 친구 수만 적는다', () => {
    expect(
      inviteBandOf({
        offer: offer({ progress: null, maxWon: null }),
        invitedCount: 3,
      }),
    ).toEqual({ inviterWon: 1000, sideLabel: '3명', ratio: null });
  });
});
