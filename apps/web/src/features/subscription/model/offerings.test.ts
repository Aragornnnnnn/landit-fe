// 셸이 준 오퍼링을 플랜별 가격표로 — 원화만 숫자로 쓰고, 같은 플랜이 둘이면 앞의 것을 믿는다
import { describe, expect, it } from 'vitest';

import {
  packageIdFor,
  toKrwPrices,
  toOfferingTiers,
  toPlanPricing,
  unclassifiablePackages,
} from './offerings';

const monthly = {
  id: '$rc_monthly',
  plan: 'monthly' as const,
  price: 9900,
  currency: 'KRW',
  period: 'P1M',
};
const yearly = {
  id: '$rc_annual',
  plan: 'yearly' as const,
  price: 59900,
  currency: 'KRW',
  period: 'P1Y',
};
// 예약 식별자는 오퍼링당 하나뿐이라 둘째 연간 상품은 커스텀 이름을 쓴다 — 셸은 플랜을 모른 채 넘긴다
const yearlyDiscount = {
  id: 'annual_discount',
  plan: null,
  price: 58500,
  currency: 'KRW',
  period: 'P1Y',
};

describe('toPlanPricing', () => {
  it('셸이 플랜을 모르면 구독 주기로 정한다 — 커스텀 이름의 할인 상품이 여기로 온다', () => {
    expect(toPlanPricing([yearlyDiscount])).toEqual({
      yearly: { packageId: 'annual_discount', price: 58500, currency: 'KRW' },
    });
  });

  it('아직 팔지 않는 주기는 건너뛴다', () => {
    expect(
      toPlanPricing([{ ...yearlyDiscount, id: 'half_year', period: 'P6M' }]),
    ).toEqual({});
  });

  it('주기를 모르는 패키지도 건너뛴다 — 플랜을 찍지 않는다', () => {
    expect(
      toPlanPricing([{ ...yearlyDiscount, id: 'unknown', period: null }]),
    ).toEqual({});
  });

  it('플랜별로 패키지 id와 가격을 묶는다', () => {
    expect(toPlanPricing([monthly, yearly])).toEqual({
      monthly: { packageId: '$rc_monthly', price: 9900, currency: 'KRW' },
      yearly: { packageId: '$rc_annual', price: 59900, currency: 'KRW' },
    });
  });

  it('한 플랜만 오면 그 플랜만 채운다 — 나머지는 기본 표시값을 쓴다', () => {
    expect(toPlanPricing([yearly])).toEqual({
      yearly: { packageId: '$rc_annual', price: 59900, currency: 'KRW' },
    });
  });

  it('커스텀 이름이 앞에 와도 예약 식별자가 그 플랜 자리를 가진다', () => {
    const impostor = { ...yearlyDiscount, id: 'annual_promo', price: 39000 };

    // 오퍼링 순서상 커스텀 패키지가 먼저다 — 그대로 두면 정가 자리를 뺏고 그 가격으로 결제된다
    expect(toPlanPricing([impostor, yearly]).yearly).toEqual({
      packageId: '$rc_annual',
      price: 59900,
      currency: 'KRW',
    });
  });

  it('예약 식별자가 없으면 그 자리는 주기로 정해진 패키지가 채운다', () => {
    const impostor = { ...yearlyDiscount, id: 'annual_promo', price: 39000 };

    expect(toPlanPricing([impostor]).yearly?.packageId).toBe('annual_promo');
  });

  it('같은 플랜이 두 번 오면 먼저 온 것을 쓴다', () => {
    const duplicate = { ...yearly, id: '$rc_annual_promo', price: 1 };

    expect(toPlanPricing([yearly, duplicate]).yearly?.packageId).toBe(
      '$rc_annual',
    );
  });
});

describe('unclassifiablePackages', () => {
  it('월간·연간 어느 쪽으로도 못 보는 패키지만 골라낸다 — 스토어 설정이 어긋났다는 신호다', () => {
    const noPeriod = { ...yearlyDiscount, id: 'broken', period: null };
    const halfYear = { ...yearlyDiscount, id: 'half_year', period: 'P6M' };

    expect(
      unclassifiablePackages([
        monthly,
        yearly,
        yearlyDiscount,
        noPeriod,
        halfYear,
      ]),
    ).toEqual([noPeriod, halfYear]);
  });
});

describe('toOfferingTiers', () => {
  const discount = yearlyDiscount;

  it('할인 패키지를 정가와 갈라 두 벌로 만든다 — 같은 연간이 둘이라 한 표에는 못 담는다', () => {
    const { list, promo } = toOfferingTiers([monthly, yearly, discount]);

    expect(list.yearly?.price).toBe(59900);
    expect(promo.yearly?.price).toBe(58500);
    expect(list.monthly?.packageId).toBe('$rc_monthly');
  });

  it('할인 패키지가 없으면 promo가 비어 있다 — 화면은 이걸 보고 할인을 숨긴다', () => {
    expect(toOfferingTiers([monthly, yearly]).promo).toEqual({});
  });

  it('월간은 할인이 없어 promo에 안 들어간다 — 시트에서도 정가 월간을 판다', () => {
    const { promo } = toOfferingTiers([monthly, discount]);

    expect(promo.monthly).toBeUndefined();
  });
});

describe('toKrwPrices', () => {
  it('원화 가격만 숫자로 넘기고 다른 통화는 비워 둔다', () => {
    const pricing = toPlanPricing([
      monthly,
      { ...yearly, price: 39.99, currency: 'USD' },
    ]);

    expect(toKrwPrices(pricing)).toEqual({ monthly: 9900, yearly: undefined });
  });
});

describe('packageIdFor', () => {
  it('가격표에 있으면 그 패키지, 없으면 RevenueCat 표준 identifier로 결제한다', () => {
    const pricing = toPlanPricing([{ ...yearly, id: '$rc_annual_kr' }]);

    expect(packageIdFor('yearly', pricing)).toBe('$rc_annual_kr');
    expect(packageIdFor('monthly', pricing)).toBe('$rc_monthly');
  });
});
