// 환급 챌린지 값의 산식 — 결제 금액에서 하루 몫과 최대 환급액이 나온다
import { describe, expect, it } from 'vitest';

import { rewardOfferOf } from './refund-offer';

describe('rewardOfferOf', () => {
  it('5만 원이면 100일 동안 하루 500원, 다 채우면 5만 원이다', () => {
    expect(rewardOfferOf(50_000)).toEqual({
      days: 100,
      dailyWon: 500,
      maximumWon: 50_000,
    });
  });

  it('일수로 나눠떨어지지 않는 가격이면 하루 몫을 내리고, 최대 환급액은 그 합이다', () => {
    expect(rewardOfferOf(55_550)).toMatchObject({
      dailyWon: 555,
      maximumWon: 55_500,
    });
  });
});
