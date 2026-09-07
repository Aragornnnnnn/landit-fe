// 선택한 플랜에 따라 갈리는 CTA·결제 안내 문구 계약 — 금액은 플랜(스토어 가격 반영본)에서 읽는다
import { describe, expect, it } from 'vitest';

import { getBillingNotice, getCtaLabel } from './paywall-copy';
import { buildPaywallPlans, MONTHLY_PLAN, YEARLY_PLAN } from './paywall-plans';

describe('getCtaLabel', () => {
  it('연간을 고르면 무료 체험으로 시작한다고 말한다', () => {
    expect(getCtaLabel(YEARLY_PLAN)).toBe('7일 무료 체험 시작하기');
  });

  it('월간을 고르면 체험 없이 월 결제액으로 시작한다고 말한다', () => {
    expect(getCtaLabel(MONTHLY_PLAN)).toBe('월 14,900원으로 시작하기');
  });

  it('스토어 가격이 다르면 그 금액으로 말한다', () => {
    const [monthly] = buildPaywallPlans({ monthly: 8_800 });

    expect(getCtaLabel(monthly)).toBe('월 8,800원으로 시작하기');
  });
});

describe('getBillingNotice', () => {
  it('연간은 체험 뒤 청구될 연 결제액과 해지 가능을 알린다', () => {
    expect(getBillingNotice(YEARLY_PLAN)).toBe(
      '7일 무료 체험 후 연 58,500원 · 언제든 해지 가능',
    );
  });

  it('월간은 매달 자동 결제되는 금액과 해지 가능을 알린다', () => {
    expect(getBillingNotice(MONTHLY_PLAN)).toBe(
      '매월 14,900원 자동 결제 · 언제든 해지 가능',
    );
  });
});
