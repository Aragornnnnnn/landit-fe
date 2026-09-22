// 셸이 준 오퍼링을 플랜별 가격표로 — 원화만 숫자로 쓰고, 같은 플랜이 둘이면 앞의 것을 믿는다
import { describe, expect, it } from 'vitest';

import {
  packageIdFor,
  toKrwPrices,
  toOfferingTiers,
  toPlanPricing,
} from './offerings';

const monthly = {
  id: '$rc_monthly',
  plan: 'monthly' as const,
  price: 9900,
  currency: 'KRW',
};
const yearly = {
  id: '$rc_annual',
  plan: 'yearly' as const,
  price: 59900,
  currency: 'KRW',
};

describe('toPlanPricing', () => {
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

  it('같은 플랜이 두 번 오면 먼저 온 것을 쓴다', () => {
    const duplicate = { ...yearly, id: '$rc_annual_promo', price: 1 };

    expect(toPlanPricing([yearly, duplicate]).yearly?.packageId).toBe(
      '$rc_annual',
    );
  });
});

describe('toOfferingTiers', () => {
  const discount = {
    id: 'annual_discount',
    plan: 'yearly' as const,
    price: 58500,
    currency: 'KRW',
  };

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
