// 친구 초대를 누구에게 보여 줄지의 계약 테스트 — 적립금이 환급에 더해지는 기능이라 환급과 상관없는 사람에게는 감춘다
import { describe, expect, it } from 'vitest';

import { referralAudienceOf } from './referral-audience';

describe('referralAudienceOf', () => {
  it('환급을 권할 무료 유저에게는 보인다', () => {
    expect(
      referralAudienceOf({ invited: true, participant: false, settled: true }),
    ).toEqual({ shown: true, settled: true });
  });

  it('환급에 참여한 사람에게는 보인다 — 적립금이 그 환급에 더해진다', () => {
    expect(
      referralAudienceOf({ invited: false, participant: true, settled: true }),
    ).toEqual({ shown: true, settled: true });
  });

  it('환급과 상관없는 기존 월간·연간 구독자에게는 감춘다', () => {
    expect(
      referralAudienceOf({ invited: false, participant: false, settled: true }),
    ).toEqual({ shown: false, settled: true });
  });

  it('누구인지 아직 모르면 감춘 채 기다린다 — 보였다가 사라지지 않게', () => {
    expect(
      referralAudienceOf({
        invited: false,
        participant: false,
        settled: false,
      }),
    ).toEqual({ shown: false, settled: false });
  });

  it('참여자라는 답이 왔으면 구독 조회를 기다리지 않는다', () => {
    expect(
      referralAudienceOf({ invited: false, participant: true, settled: false }),
    ).toEqual({ shown: true, settled: true });
  });
});
