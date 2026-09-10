// 페이월 플랜 표시값 계약 — 화면에 박히는 할인율·환산가가 실제 가격 산식과 어긋나지 않게 지킨다
import { describe, expect, it } from 'vitest';

import {
  buildPaywallPlans,
  calculateDiscountRate,
  calculateMonthlyEquivalent,
  DEFAULT_PLAN_ID,
  formatWon,
  PLAN_ORDER,
  planFromProductId,
} from './plans';

describe('calculateDiscountRate', () => {
  it('비교가와 판매가로 정수 퍼센트를 돌려준다', () => {
    expect(calculateDiscountRate(10_000, 5_000)).toBe(50);
  });

  it('소수점은 반올림한다 — 월 14,900 대비 월 4,900은 67.1%라 67로 본다', () => {
    expect(calculateDiscountRate(14_900, 4_900)).toBe(67);
  });
});

describe('calculateMonthlyEquivalent', () => {
  it('연 결제액을 12로 나눠 100원 단위로 올린다 — 58,500원은 4,875원이라 월 4,900원', () => {
    expect(calculateMonthlyEquivalent(58_500)).toBe(4_900);
  });

  it('딱 떨어지면 그대로다 — 58,800원이면 월 4,900원', () => {
    expect(calculateMonthlyEquivalent(58_800)).toBe(4_900);
  });

  it('실제보다 낮게 보이지 않게 올린다 — 59,900원이면 월 4,990원이 아니라 5,000원', () => {
    expect(calculateMonthlyEquivalent(59_900)).toBe(5_000);
  });
});

describe('formatWon', () => {
  it('천 단위 쉼표와 원을 붙인다', () => {
    expect(formatWon(58_500)).toBe('58,500원');
  });
});

describe('buildPaywallPlans — 등록값', () => {
  const { monthly, yearly } = buildPaywallPlans();

  it('월간·연간 순서로 놓이고 기본 선택은 연간이다', () => {
    expect(PLAN_ORDER).toEqual(['monthly', 'yearly']);
    expect(DEFAULT_PLAN_ID).toBe('yearly');
  });

  it('월간 카드는 할인 강조가 없다 — 배지도 비교 취소선도 두지 않는다', () => {
    expect(monthly.badge).toBeUndefined();
    expect(monthly.monthlyListPrice).toBeUndefined();
  });

  it('월간 카드의 월 금액은 실제 청구액과 같다', () => {
    expect(monthly.monthlyPrice).toBe(monthly.price);
  });

  it('연간 카드의 큰 숫자는 연 결제액을 달로 나눈 값이고, 취소선은 월간 실제 판매가다', () => {
    expect(yearly.monthlyPrice).toBe(calculateMonthlyEquivalent(yearly.price));
    expect(yearly.monthlyListPrice).toBe(monthly.price);
  });

  it('연간 배지의 퍼센트는 월간 판매가 대비 월 환산가 산식과 같다', () => {
    const rate = calculateDiscountRate(monthly.price, yearly.monthlyPrice);

    expect(yearly.badge).toBe(`월간보다 ${rate}% 저렴`);
  });

  it('연간 부제에는 실제 청구되는 연 결제액이 들어간다', () => {
    expect(yearly.subtitle).toBe(
      `연 ${formatWon(yearly.price)} · 7일 무료 체험`,
    );
  });
});

describe('buildPaywallPlans — 스토어 가격', () => {
  it('스토어 가격을 주면 큰 숫자·취소선·배지·부제가 전부 그 값에서 다시 계산된다', () => {
    const { monthly, yearly } = buildPaywallPlans({
      monthly: 11_000,
      yearly: 66_000,
    });

    expect(monthly.price).toBe(11_000);
    expect(monthly.badge).toBeUndefined();
    expect(yearly.monthlyListPrice).toBe(11_000);
    expect(yearly.monthlyPrice).toBe(5_500);
    expect(yearly.badge).toBe('월간보다 50% 저렴');
    expect(yearly.subtitle).toBe('연 66,000원 · 7일 무료 체험');
  });

  it('한 플랜만 주면 나머지는 등록값을 쓴다', () => {
    const { monthly, yearly } = buildPaywallPlans({ yearly: 49_900 });

    expect(monthly.price).toBe(14_900);
    expect(yearly.price).toBe(49_900);
  });
});

describe('planFromProductId', () => {
  it('스토어 상품 식별자를 플랜으로 바꾼다', () => {
    expect(planFromProductId('com.saynow.app.premium.monthly')).toBe('monthly');
    expect(planFromProductId('com.saynow.app.premium.yearly')).toBe('yearly');
  });

  it('모르는 값이나 빈 값은 null이다', () => {
    expect(planFromProductId('com.saynow.app.premium.promo')).toBeNull();
    expect(planFromProductId(null)).toBeNull();
    expect(planFromProductId(undefined)).toBeNull();
  });
});
