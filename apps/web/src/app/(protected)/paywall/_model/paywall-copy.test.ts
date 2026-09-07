// 선택한 플랜에 따라 갈리는 CTA·결제 안내 문구 계약
import { describe, expect, it } from 'vitest';

import { billingNotice, ctaLabel } from './paywall-copy';

describe('ctaLabel', () => {
  it('연간을 고르면 무료 체험으로 시작한다고 말한다', () => {
    expect(ctaLabel('yearly')).toBe('7일 무료 체험 시작하기');
  });

  it('월간을 고르면 체험 없이 월 결제액으로 시작한다고 말한다', () => {
    expect(ctaLabel('monthly')).toBe('월 9,900원으로 시작하기');
  });
});

describe('billingNotice', () => {
  it('연간은 체험 뒤 청구될 연 결제액과 해지 가능을 알린다', () => {
    expect(billingNotice('yearly')).toBe(
      '7일 무료 체험 후 연 59,900원 · 언제든 해지 가능',
    );
  });

  it('월간은 매달 자동 결제되는 금액과 해지 가능을 알린다', () => {
    expect(billingNotice('monthly')).toBe(
      '매월 9,900원 자동 결제 · 언제든 해지 가능',
    );
  });
});
