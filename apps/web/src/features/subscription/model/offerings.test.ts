// 셸이 준 오퍼링을 플랜별 가격표로 — 원화만 숫자로 쓰고, 같은 플랜이 둘이면 앞의 것을 믿는다
import { describe, expect, it } from 'vitest';

import { packageIdFor, toPlanPricing } from './offerings';

const monthly = {
  id: '$rc_monthly',
  plan: 'monthly' as const,
  price: 9900,
  currency: 'KRW',
  priceString: '₩9,900',
};
const yearly = {
  id: '$rc_annual',
  plan: 'yearly' as const,
  price: 59900,
  currency: 'KRW',
  priceString: '₩59,900',
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

describe('packageIdFor', () => {
  it('가격표에 있으면 그 패키지, 없으면 RevenueCat 표준 identifier로 결제한다', () => {
    const pricing = toPlanPricing([{ ...yearly, id: '$rc_annual_kr' }]);

    expect(packageIdFor('yearly', pricing)).toBe('$rc_annual_kr');
    expect(packageIdFor('monthly', pricing)).toBe('$rc_monthly');
  });
});
