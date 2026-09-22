// 이탈 할인 시트의 숫자 — 스토어가 준 값으로 할인율·월 환산·결제할 패키지를 정한다
import { describe, expect, it } from 'vitest';

import { toOfferingTiers } from './offerings';
import { buildPromoSheet } from './promo-sheet';

const pkg = (id: string, plan: 'monthly' | 'yearly', price: number) => ({
  id,
  plan,
  price,
  currency: 'KRW',
});

const tiers = (...packages: ReturnType<typeof pkg>[]) =>
  toOfferingTiers(packages);

const full = [
  pkg('$rc_monthly', 'monthly', 14_900),
  pkg('$rc_annual', 'yearly', 94_800),
  pkg('annual_discount', 'yearly', 58_500),
];

describe('buildPromoSheet', () => {
  it('할인 연간의 월 환산과 정가 대비 할인율을 낸다', () => {
    const sheet = buildPromoSheet(tiers(...full));

    expect(sheet).toMatchObject({
      yearly: {
        price: 58_500,
        monthlyPrice: 4_900,
        monthlyListPrice: 7_900,
        discountRate: 38,
        packageId: 'annual_discount',
      },
    });
  });

  it('월간은 할인이 없어 정가 그대로 판다', () => {
    const sheet = buildPromoSheet(tiers(...full));

    expect(sheet?.monthly).toMatchObject({
      price: 14_900,
      packageId: '$rc_monthly',
    });
  });

  it('할인 패키지가 없으면 시트를 만들지 않는다 — 화면이 이걸 보고 띄우지 않는다', () => {
    expect(
      buildPromoSheet(tiers(pkg('$rc_annual', 'yearly', 94_800))),
    ).toBeNull();
  });

  it('정가 연간을 못 받았으면 비교선도 할인율도 없다 — 스토어에 없는 정가를 지어내지 않는다', () => {
    const sheet = buildPromoSheet(
      tiers(pkg('annual_discount', 'yearly', 58_500)),
    );

    expect(sheet?.yearly).toMatchObject({
      price: 58_500,
      monthlyPrice: 4_900,
      monthlyListPrice: null,
      discountRate: null,
    });
  });

  it('월간을 못 받았으면 등록값과 표준 패키지로 판다', () => {
    const sheet = buildPromoSheet(
      tiers(pkg('annual_discount', 'yearly', 58_500)),
    );

    expect(sheet?.monthly).toMatchObject({
      price: 14_900,
      packageId: '$rc_monthly',
    });
  });
});
