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
  it('할인 연간의 월 환산과, 월간으로 1년 쓸 때 대비 할인율을 낸다', () => {
    const sheet = buildPromoSheet(tiers(...full));

    expect(sheet).toMatchObject({
      yearly: {
        price: 58_500,
        monthlyPrice: 4_900,
        discountRate: 67,
        packageId: 'annual_discount',
      },
    });
  });

  it('월간은 할인이 없어 정가 그대로 팔고, 연 환산과 차액을 같이 낸다', () => {
    const sheet = buildPromoSheet(tiers(...full));

    expect(sheet?.monthly).toMatchObject({
      price: 14_900,
      yearlyEquivalent: 178_800,
      packageId: '$rc_monthly',
    });
    expect(sheet?.savings).toBe(120_300);
  });

  it('할인 패키지가 없으면 시트를 만들지 않는다 — 화면이 이걸 보고 띄우지 않는다', () => {
    expect(
      buildPromoSheet(tiers(pkg('$rc_annual', 'yearly', 94_800))),
    ).toBeNull();
  });

  it('정가 연간을 못 받았으면 시트를 만들지 않는다 — 인상 여부를 확인할 길이 없다', () => {
    expect(
      buildPromoSheet(
        tiers(
          pkg('$rc_monthly', 'monthly', 14_900),
          pkg('annual_discount', 'yearly', 58_500),
        ),
      ),
    ).toBeNull();
  });

  it('정가 연간이 할인가와 같으면 시트를 만들지 않는다 — 정가 인상 전에 오퍼링에 먼저 넣어 둬도 아무 일이 없다', () => {
    expect(
      buildPromoSheet(
        tiers(
          pkg('$rc_monthly', 'monthly', 14_900),
          pkg('$rc_annual', 'yearly', 58_500),
          pkg('annual_discount', 'yearly', 58_500),
        ),
      ),
    ).toBeNull();
  });

  it('월간을 못 받았으면 시트를 만들지 않는다 — 비교할 자가 없으면 할인율도 없다', () => {
    expect(
      buildPromoSheet(
        tiers(
          pkg('$rc_annual', 'yearly', 94_800),
          pkg('annual_discount', 'yearly', 58_500),
        ),
      ),
    ).toBeNull();
  });

  it('월간이 할인 연간보다 싸면 시트를 만들지 않는다 — 할인이 아닌 것을 할인이라 부르지 않는다', () => {
    expect(
      buildPromoSheet(
        tiers(
          pkg('$rc_monthly', 'monthly', 4_000),
          pkg('$rc_annual', 'yearly', 94_800),
          pkg('annual_discount', 'yearly', 58_500),
        ),
      ),
    ).toBeNull();
  });

  it('원화가 아니면 시트를 만들지 않는다 — 화면 숫자가 「원」 표기를 전제로 짜여 있다', () => {
    const usd = { ...pkg('annual_discount', 'yearly', 39.99), currency: 'USD' };

    expect(
      buildPromoSheet(
        tiers(
          pkg('$rc_monthly', 'monthly', 14_900),
          pkg('$rc_annual', 'yearly', 94_800),
          usd,
        ),
      ),
    ).toBeNull();
  });
});
