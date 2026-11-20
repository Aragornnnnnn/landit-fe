// 선택한 플랜에 따라 갈리는 CTA 문구 계약 — 금액은 플랜(스토어 가격 반영본)에서 읽는다
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import { buildPaywallPlans } from '@/features/subscription/model/product/plans';
import ja from '@/shared/i18n/locales/ja';
import ko from '@/shared/i18n/locales/ko';

import { getCtaLabel } from './paywall-copy';

const { monthly, yearly } = buildPaywallPlans();
const t = createTranslator({
  locale: 'ko',
  messages: ko,
  namespace: 'paywall',
});
const tJa = createTranslator({
  locale: 'ja',
  messages: ja,
  namespace: 'paywall',
});

describe('getCtaLabel', () => {
  it('연간을 고르면 연 결제액으로 시작한다고 말한다', () => {
    expect(getCtaLabel(yearly, t)).toBe('연 58,500원으로 시작하기');
  });

  it('월간을 고르면 체험 없이 월 결제액으로 시작한다고 말한다', () => {
    expect(getCtaLabel(monthly, t)).toBe('월 5,900원으로 시작하기');
  });

  it('스토어 가격이 다르면 그 금액으로 말한다', () => {
    const cheaper = buildPaywallPlans({ monthly: 8_800 }).monthly;

    expect(getCtaLabel(cheaper, t)).toBe('월 8,800원으로 시작하기');
  });
});

describe('엔화 스토어', () => {
  it('금액을 엔화로 적는다', () => {
    const yen = buildPaywallPlans({ monthly: 980, yearly: 5_800 }, 'JPY');

    expect(getCtaLabel(yen.monthly, t)).toBe('월 980円으로 시작하기');
  });
});

describe('일본어 화면', () => {
  it('엔화 금액을 일본어 CTA로 적는다', () => {
    const yen = buildPaywallPlans({ monthly: 980, yearly: 5_800 }, 'JPY');

    expect(getCtaLabel(yen.yearly, tJa)).toBe('年額5,800円で始める');
    expect(getCtaLabel(yen.monthly, tJa)).toBe('月額980円で始める');
  });
});
