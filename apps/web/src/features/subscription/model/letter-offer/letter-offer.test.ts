// 편지 혜택가 — 지정한 편지인지 가리고, 스토어가 준 할인 연간으로 카드 숫자를 만든다
import { describe, expect, it } from 'vitest';

import type { Offering } from '../product/offering';
import { buildLetterOffer, isOfferLetter } from './letter-offer';

const full: Offering = {
  regular: {
    monthly: { packageId: '$rc_monthly', price: 14_900, currency: 'KRW' },
    yearly: { packageId: '$rc_annual', price: 94_500, currency: 'KRW' },
  },
  promo: {
    yearly: { packageId: 'annual_discount', price: 58_500, currency: 'KRW' },
  },
};

describe('isOfferLetter', () => {
  it('환경변수에 적힌 편지면 true를 낸다', () => {
    expect(isOfferLetter(12, '12')).toBe(true);
  });

  it('쉼표로 여러 통을 적으면 그중 하나여도 true를 낸다', () => {
    expect(isOfferLetter(15, '12, 15')).toBe(true);
  });

  it('다른 편지면 false를 낸다', () => {
    expect(isOfferLetter(13, '12')).toBe(false);
  });

  it('쉼표 사이 빈칸은 편지 id로 치지 않는다 — 0번 편지가 걸리지 않게', () => {
    expect(isOfferLetter(0, '12,')).toBe(false);
  });

  it('환경변수가 없으면 어떤 편지도 false를 낸다', () => {
    expect(isOfferLetter(12, undefined)).toBe(false);
  });
});

describe('buildLetterOffer', () => {
  it('할인 연간 가격과 월 환산, 정가 연간을 비교가로 낸다', () => {
    const offer = buildLetterOffer(full);

    expect(offer).toMatchObject({
      price: 58_500,
      monthlyPrice: 4_900,
      listPrice: 94_500,
      packages: { yearly: full.promo.yearly },
    });
  });

  it('결제할 패키지에는 할인 연간만 담는다 — 다른 플랜으로 결제될 길을 남기지 않는다', () => {
    const offer = buildLetterOffer(full);

    expect(offer?.packages).toEqual({ yearly: full.promo.yearly });
  });

  it('할인 패키지가 없으면 null이다 — 혜택가를 보여 놓고 정가로 결제되면 안 된다', () => {
    expect(buildLetterOffer({ ...full, promo: {} })).toBeNull();
  });

  it('할인 패키지가 원화가 아니면 null이다', () => {
    const usd: Offering = {
      ...full,
      promo: {
        yearly: { packageId: 'annual_discount', price: 39.99, currency: 'USD' },
      },
    };

    expect(buildLetterOffer(usd)).toBeNull();
  });

  it('정가 연간이 할인가보다 비싸지 않으면 비교가를 뺀다', () => {
    const offer = buildLetterOffer({
      ...full,
      regular: {
        yearly: { packageId: '$rc_annual', price: 58_500, currency: 'KRW' },
      },
    });

    expect(offer?.listPrice).toBeNull();
  });

  it('정가 연간을 못 받았으면 비교가를 뺀다', () => {
    const offer = buildLetterOffer({ ...full, regular: {} });

    expect(offer?.listPrice).toBeNull();
  });
});
