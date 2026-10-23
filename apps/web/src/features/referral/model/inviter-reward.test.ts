// 초대한 사람이 받는 몫 규칙 테스트 — 정책 금액과 서버 상한(인원·금액·무제한)을 화면이 쓰는 모양으로 바꾼다
import { describe, expect, it } from 'vitest';

import type { ReferralInviterLimit, ReferralStage } from '../api/referral';
import { inviteOfferOf, inviterWonOf } from './inviter-reward';

const stage = (over: Partial<ReferralStage> = {}): ReferralStage => ({
  enabled: true,
  target: 'BOTH',
  inviterWon: 1000,
  inviteeWon: 3000,
  ...over,
});

const off: ReferralStage = {
  enabled: false,
  target: 'NONE',
  inviterWon: 0,
  inviteeWon: 0,
};

const limit = (
  type: ReferralInviterLimit['type'],
  value: number | null,
  used: number | null,
  remaining: number | null,
): ReferralInviterLimit => ({ type, value, used, remaining });

const summary = ({
  signup = stage(),
  purchase = off,
  inviterLimit,
  invitedCount = 0,
}: {
  signup?: ReferralStage;
  purchase?: ReferralStage;
  inviterLimit?: ReferralInviterLimit;
  invitedCount?: number;
}) => ({
  currentOffer: {
    code: null,
    policyVersion: 1,
    signup,
    purchase,
    purchaseProductNames: [],
  },
  invitedCount,
  inviterLimit,
});

describe('inviterWonOf', () => {
  it.each(['BOTH', 'INVITER'] as const)(
    '대상이 %s면 초대한 사람 몫을 준다',
    (target) => {
      expect(inviterWonOf(stage({ target }))).toBe(1000);
    },
  );

  it.each([
    ['초대받은 사람만이면', stage({ target: 'INVITEE' })],
    ['단계가 꺼져 있으면', stage({ enabled: false })],
  ])('%s 0이다', (_, given) => {
    expect(inviterWonOf(given)).toBe(0);
  });
});

describe('inviteOfferOf', () => {
  it('인원 상한이면 인원 진행과, 인원 × 한 명당 금액을 최대 금액으로 준다', () => {
    expect(
      inviteOfferOf(
        summary({
          inviterLimit: limit('INVITE_COUNT', 10, 3, 7),
          invitedCount: 3,
        }),
      ),
    ).toEqual({
      inviterWon: 1000,
      inviteeWon: 3000,
      progress: { kind: 'count', used: 3, total: 10 },
      maxWon: 10000,
      full: false,
    });
  });

  it('결제 단계에도 초대한 사람 몫이 있으면 최대 금액을 적지 않는다 — 결제 보상이 더해져 넘칠 수 있다', () => {
    expect(
      inviteOfferOf(
        summary({
          purchase: stage({ inviterWon: 5000 }),
          inviterLimit: limit('INVITE_COUNT', 10, 0, 10),
        }),
      )?.maxWon,
    ).toBeNull();
  });

  it('금액 상한이면 서버가 정한 지급액으로 진행을 그리고 그 금액을 최대로 준다', () => {
    expect(
      inviteOfferOf(
        summary({ inviterLimit: limit('TOTAL_AMOUNT', 10000, 4000, 6000) }),
      ),
    ).toMatchObject({
      progress: { kind: 'amount', used: 4000, total: 10000 },
      maxWon: 10000,
      full: false,
    });
  });

  it('다 찼는지는 서버가 준 남은 양으로 본다 — 금액 상한의 부분 지급까지 서버와 같게 판단한다', () => {
    expect(
      inviteOfferOf(
        summary({ inviterLimit: limit('TOTAL_AMOUNT', 10000, 10000, 0) }),
      )?.full,
    ).toBe(true);
  });

  it('상한 값이 0이면 진행을 그리지 않는다 — 0으로 나누지 않게', () => {
    expect(
      inviteOfferOf(summary({ inviterLimit: limit('INVITE_COUNT', 0, 0, 0) })),
    ).toMatchObject({ progress: null, maxWon: null });
  });

  it('무제한이면 진행·최대 금액이 없고 다 차지 않는다', () => {
    expect(
      inviteOfferOf(
        summary({ inviterLimit: limit('UNLIMITED', null, null, null) }),
      ),
    ).toMatchObject({ progress: null, maxWon: null, full: false });
  });

  it('상한 필드가 없는 서버(develop)에서도 깨지지 않고 무제한으로 본다', () => {
    expect(inviteOfferOf(summary({}))).toMatchObject({
      progress: null,
      maxWon: null,
      full: false,
    });
  });

  it('초대한 사람 몫이 없으면 null이다 — 초대 자리를 숨긴다', () => {
    expect(
      inviteOfferOf(summary({ signup: stage({ target: 'INVITEE' }) })),
    ).toBeNull();
  });
});
