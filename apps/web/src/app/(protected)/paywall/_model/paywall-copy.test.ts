// 선택한 플랜에 따라 갈리는 CTA·결제 안내 문구 계약 — 금액은 플랜(스토어 가격 반영본)에서 읽는다
import { describe, expect, it } from 'vitest';

import { buildPaywallPlans } from '@/features/subscription/model/plans';

import { getBillingNotice, getCtaLabel, getTrialNotice } from './paywall-copy';

const { monthly, yearly } = buildPaywallPlans();

describe('getCtaLabel', () => {
  it('연간을 고르면 무료 체험으로 시작한다고 말한다', () => {
    expect(getCtaLabel(yearly)).toBe('7일 무료 체험 시작하기');
  });

  it('월간을 고르면 체험 없이 월 결제액으로 시작한다고 말한다', () => {
    expect(getCtaLabel(monthly)).toBe('월 14,900원으로 시작하기');
  });

  it('스토어 가격이 다르면 그 금액으로 말한다', () => {
    const cheaper = buildPaywallPlans({ monthly: 8_800 }).monthly;

    expect(getCtaLabel(cheaper)).toBe('월 8,800원으로 시작하기');
  });
});

describe('getBillingNotice', () => {
  it('연간은 체험 뒤 청구될 연 결제액과 해지 가능을 알린다', () => {
    expect(getBillingNotice(yearly)).toBe(
      '7일 무료 체험 후 연 58,500원 정기 결제 · 언제든 해지 가능',
    );
  });

  it('월간은 매달 정기 결제되는 금액과 해지 가능을 알린다', () => {
    expect(getBillingNotice(monthly)).toBe(
      '매월 14,900원 정기 결제 · 언제든 해지 가능',
    );
  });
});

describe('getTrialNotice', () => {
  it('연간(체험)에만 24시간 전 해지 안내를 붙이고 월간엔 없다', () => {
    const { monthly, yearly } = buildPaywallPlans();
    expect(getTrialNotice(yearly)).toBe(
      '체험 종료 24시간 전까지 해지하면 청구되지 않아요',
    );
    expect(getTrialNotice(monthly)).toBeNull();
  });
});
