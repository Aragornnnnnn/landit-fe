// 환급을 누구에게 보여 줄지의 계약 테스트
import { describe, expect, it } from 'vitest';

import { rewardAudienceOf } from './reward-audience';

// 결제가 열린 환경에서 환급 응답까지 받은 무료 유저
const base = {
  launched: true,
  paymentLive: true,
  premium: false as boolean | undefined,
  subscriptionFailed: false,
  rewardLoaded: true,
  rewardFailed: false,
  participant: false,
};

describe('rewardAudienceOf', () => {
  it('출시 스위치가 꺼져 있으면 권하지 않고, 더 기다릴 것도 없다', () => {
    expect(rewardAudienceOf({ ...base, launched: false })).toEqual({
      invited: false,
      settled: true,
    });
  });

  it('환급과 상관없는 무료 유저에게는 권한다', () => {
    expect(rewardAudienceOf(base)).toEqual({ invited: true, settled: true });
  });

  it('구독이 끝났어도 환급에 참여한 사람에게는 권하지 않는다', () => {
    // given — 기간을 마치고 갱신하지 않았다. 돌려받을 금액을 봐야 한다
    expect(rewardAudienceOf({ ...base, participant: true }).invited).toBe(
      false,
    );
  });

  it('환급과 상관없는 유료 유저에게는 권하지 않는다', () => {
    expect(rewardAudienceOf({ ...base, premium: true })).toEqual({
      invited: false,
      settled: true,
    });
  });

  it('결제가 닫힌 환경에서는 권하지 않고, 구독을 기다리지도 않는다', () => {
    const audience = rewardAudienceOf({
      ...base,
      paymentLive: false,
      premium: undefined,
    });

    expect(audience).toEqual({ invited: false, settled: true });
  });

  it('환급 응답을 받기 전에는 단정하지 않는다', () => {
    expect(rewardAudienceOf({ ...base, rewardLoaded: false })).toEqual({
      invited: false,
      settled: false,
    });
  });

  it('환급 조회가 실패하면 권하지 않은 채로 마무리한다', () => {
    // given — 환급을 못 받아도 원래의 프리미엄 진입은 떠야 한다
    const audience = rewardAudienceOf({
      ...base,
      rewardLoaded: false,
      rewardFailed: true,
    });

    expect(audience).toEqual({ invited: false, settled: true });
  });

  it('구독을 아직 모르면 단정하지 않는다', () => {
    expect(rewardAudienceOf({ ...base, premium: undefined })).toEqual({
      invited: false,
      settled: false,
    });
  });

  it('구독 조회가 실패하면 권하지 않은 채로 마무리한다', () => {
    // given — 기다려도 오지 않는다. 화면이 빈 채로 남으면 안 된다
    const audience = rewardAudienceOf({
      ...base,
      premium: undefined,
      subscriptionFailed: true,
    });

    expect(audience).toEqual({ invited: false, settled: true });
  });
});
