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
        listPrice: 94_800,
        monthlyPrice: 4_900,
        monthlyListPrice: 7_900,
        discountRate: 38,
        packageId: 'annual_discount',
      },
    });
  });

  it('월간은 할인이 없어 정가 그대로 팔고, 연 환산을 같이 낸다 — 연간과 같은 자로 비교되게', () => {
    const sheet = buildPromoSheet(tiers(...full));

    expect(sheet?.monthly).toMatchObject({
      price: 14_900,
      yearlyEquivalent: 178_800,
      packageId: '$rc_monthly',
    });
  });

  it('할인 패키지가 없으면 시트를 만들지 않는다 — 화면이 이걸 보고 띄우지 않는다', () => {
    expect(
      buildPromoSheet(tiers(pkg('$rc_annual', 'yearly', 94_800))),
    ).toBeNull();
  });

  it('정가 연간을 못 받았으면 시트를 만들지 않는다 — 스토어에 없는 정가로 할인율을 지어내지 않는다', () => {
    expect(
      buildPromoSheet(tiers(pkg('annual_discount', 'yearly', 58_500))),
    ).toBeNull();
  });

  it('정가와 같으면 시트를 만들지 않는다 — 정가 인상 전에 오퍼링에 먼저 넣어 둬도 아무 일이 없다', () => {
    expect(
      buildPromoSheet(
        tiers(
          pkg('$rc_annual', 'yearly', 58_500),
          pkg('annual_discount', 'yearly', 58_500),
        ),
      ),
    ).toBeNull();
  });

  it('원화가 아니면 시트를 만들지 않는다 — 화면 숫자가 「원」 표기를 전제로 짜여 있다', () => {
    const usd = { ...pkg('annual_discount', 'yearly', 39.99), currency: 'USD' };

    expect(
      buildPromoSheet(tiers(pkg('$rc_annual', 'yearly', 94_800), usd)),
    ).toBeNull();
  });

  it('월간을 못 받았으면 등록값과 표준 패키지로 판다', () => {
    const sheet = buildPromoSheet(
      tiers(
        pkg('$rc_annual', 'yearly', 94_800),
        pkg('annual_discount', 'yearly', 58_500),
      ),
    );

    expect(sheet?.monthly).toMatchObject({
      price: 14_900,
      packageId: '$rc_monthly',
    });
  });
});
