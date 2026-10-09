// 롱 페이월 고정 콘텐츠의 계약 — 예문 카드는 짚을 표현이 문장 안에 그대로 있어야 주황 강조가 제자리에 앉는다
import { describe, expect, it } from 'vitest';

import {
  buildRefundPlans,
  EXAMPLE_CARDS,
  EXAMPLE_LANDING_INDEX,
  isRefundPlan,
  maskName,
} from './paywall-content';

describe('EXAMPLE_CARDS', () => {
  it('짚을 표현이 모든 문장 안에 한 번씩 들어 있다', () => {
    EXAMPLE_CARDS.forEach(({ sentence, highlight }) => {
      expect(sentence.split(highlight)).toHaveLength(2);
    });
  });

  it('카드마다 그림이 다르다', () => {
    const images = EXAMPLE_CARDS.map((card) => card.image);

    expect(new Set(images).size).toBe(images.length);
  });

  it('멈춰 설 카드 뒤에도 카드가 남아 줄이 끊겨 보이지 않는다', () => {
    expect(
      EXAMPLE_CARDS.length - 1 - EXAMPLE_LANDING_INDEX,
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('maskName', () => {
  it('짧은 이름은 첫 글자만 남기고 가린다', () => {
    expect(maskName('마먀먀먀')).toBe('마***');
    expect(maskName('리움07')).toBe('리***');
  });

  it('다섯 글자 넘는 이름은 앞 두 글자를 남긴다', () => {
    expect(maskName('qwaszx96')).toBe('qw******');
  });

  it('한 글자 이름도 가려진 자리가 하나는 생긴다', () => {
    expect(maskName('김')).toBe('김*');
  });
});

describe('buildRefundPlans', () => {
  it('스토어 가격이 없으면 등록값으로 결제 금액과 최대 환급액을 정한다', () => {
    const { halfyear, quarterly } = buildRefundPlans();

    expect(halfyear).toMatchObject({
      months: 6,
      price: 59_900,
      maxRefund: 59_900,
    });
    expect(quarterly).toMatchObject({
      months: 3,
      price: 39_900,
      maxRefund: 31_920,
    });
  });

  it('셸이 준 원화 가격이 있으면 결제 금액과 최대 환급액을 그 값으로 다시 계산한다', () => {
    const { halfyear, quarterly } = buildRefundPlans({
      halfyear: 49_900,
      quarterly: 29_900,
    });

    expect(halfyear).toMatchObject({ price: 49_900, maxRefund: 49_900 });
    expect(quarterly).toMatchObject({ price: 29_900, maxRefund: 23_920 });
  });
});

describe('isRefundPlan', () => {
  it('3개월·6개월만 환급 플랜이다', () => {
    expect(isRefundPlan('halfyear')).toBe(true);
    expect(isRefundPlan('quarterly')).toBe(true);
    expect(isRefundPlan('yearly')).toBe(false);
    expect(isRefundPlan('monthly')).toBe(false);
  });
});
