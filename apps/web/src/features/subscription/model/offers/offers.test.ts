// 무엇을 팔고 보여 줄지 정하는 규칙 — 언어·시각·스위치·앱 버전 조합마다 기능별 켜짐을 확인한다
import { describe, expect, it } from 'vitest';

import { decideOffers, type OfferEnvironment } from './offers';

const UNTIL = Date.parse('2026-11-20T00:00:00+09:00');
const BEFORE = UNTIL - 1;

const shell = (appVersion = '1.4.0') => ({
  platform: 'ios' as const,
  appVersion,
  buildNumber: '18',
  bridgeVersion: 8,
});

const environment = (
  overrides: Partial<OfferEnvironment> = {},
): OfferEnvironment => ({
  locale: 'ko',
  context: shell(),
  now: BEFORE,
  rewardEnabled: true,
  rewardSaleUntil: UNTIL,
  referralUntil: UNTIL,
  promoEnabled: true,
  ...overrides,
});

describe('decideOffers — 환급 판매', () => {
  it('종료 시각 직전까지는 환급을 판다', () => {
    expect(decideOffers(environment({ now: BEFORE })).rewardSale).toBe(true);
  });

  it('종료 시각이 되면 환급을 팔지 않는다', () => {
    expect(decideOffers(environment({ now: UNTIL })).rewardSale).toBe(false);
  });

  it('종료 시각이 없으면 팔지 않는다 — 값이 빠져도 판매가 되살아나지 않는다', () => {
    expect(
      decideOffers(environment({ rewardSaleUntil: null })).rewardSale,
    ).toBe(false);
  });

  it.each([
    ['일본어 화면', { locale: 'ja' as const }],
    ['환급 스위치가 꺼진 배포', { rewardEnabled: false }],
    ['환급 상품이 없는 앱 버전', { context: shell('1.3.3') }],
    ['브라우저', { context: null }],
  ])('%s에는 종료 시각 전에도 팔지 않는다', (_, overrides) => {
    expect(decideOffers(environment(overrides)).rewardSale).toBe(false);
  });
});

describe('decideOffers — 환급 참여자 화면', () => {
  it('판매가 끝나도 이미 산 사람의 환급 화면은 그대로 보여 준다', () => {
    expect(decideOffers(environment({ now: UNTIL })).rewardView).toBe(true);
  });

  it('종료 시각이 없어도 환급 화면은 보여 준다', () => {
    expect(
      decideOffers(environment({ rewardSaleUntil: null })).rewardView,
    ).toBe(true);
  });

  it.each([
    ['일본어 화면', { locale: 'ja' as const }],
    ['환급 스위치가 꺼진 배포', { rewardEnabled: false }],
    ['환급 상품이 없는 앱 버전', { context: shell('1.3.3') }],
    ['브라우저', { context: null }],
  ])('%s에는 환급 화면이 없다', (_, overrides) => {
    expect(decideOffers(environment(overrides)).rewardView).toBe(false);
  });
});

describe('decideOffers — 프리뷰와 단계형 페이월', () => {
  it('환급을 파는 동안에는 연다', () => {
    expect(decideOffers(environment()).previewFlow).toBe(true);
  });

  it('환급 판매가 끝난 한국어 화면에도 연다 — 구독만 파는 일본어 화면과 같은 흐름이다', () => {
    expect(decideOffers(environment({ now: UNTIL })).previewFlow).toBe(true);
  });

  it('환급 스위치가 꺼진 배포의 한국어 화면에도 연다 — 환급을 팔지 않는 화면은 어디든 구독만 파는 흐름이다', () => {
    expect(
      decideOffers(environment({ rewardEnabled: false })).previewFlow,
    ).toBe(true);
  });

  it('일본어 화면은 늘 연다', () => {
    expect(decideOffers(environment({ locale: 'ja' })).previewFlow).toBe(true);
  });

  it('환급을 파는 기간에 환급 상품이 없는 앱 버전에는 열지 않는다 — 환급으로 이어지는 프리뷰를 보여 줄 수 없다', () => {
    expect(
      decideOffers(environment({ context: shell('1.3.3') })).previewFlow,
    ).toBe(false);
  });

  it('판매가 끝나면 환급 상품이 없는 앱 버전에도 연다', () => {
    expect(
      decideOffers(environment({ now: UNTIL, context: shell('1.3.3') }))
        .previewFlow,
    ).toBe(true);
  });
});

describe('decideOffers — 친구 초대', () => {
  it('종료 시각 직전까지는 연다', () => {
    expect(decideOffers(environment({ now: BEFORE })).referral).toBe(true);
  });

  it('종료 시각이 되면 닫는다', () => {
    expect(decideOffers(environment({ now: UNTIL })).referral).toBe(false);
  });

  it('종료 시각이 없으면 닫혀 있다', () => {
    expect(decideOffers(environment({ referralUntil: null })).referral).toBe(
      false,
    );
  });

  it('일본어 화면에는 열지 않는다', () => {
    expect(decideOffers(environment({ locale: 'ja' })).referral).toBe(false);
  });

  it('환급 판매와 따로 끝난다 — 환급만 끝나도 초대는 자기 시각까지 열려 있다', () => {
    const offers = decideOffers(
      environment({ now: UNTIL, referralUntil: UNTIL + 1000 }),
    );

    expect(offers.rewardSale).toBe(false);
    expect(offers.referral).toBe(true);
  });
});

describe('decideOffers — 한국에서만 파는 그 밖의 혜택', () => {
  it('이탈 할인은 스위치가 켜진 한국어 화면에만 연다', () => {
    expect(decideOffers(environment()).exitPromo).toBe(true);
    expect(decideOffers(environment({ promoEnabled: false })).exitPromo).toBe(
      false,
    );
    expect(decideOffers(environment({ locale: 'ja' })).exitPromo).toBe(false);
  });

  it('편지 혜택가와 이벤트 공지는 한국어 화면에만 연다 — 환급 판매가 끝나도 그대로다', () => {
    const korean = decideOffers(environment({ now: UNTIL }));
    const japanese = decideOffers(environment({ locale: 'ja' }));

    expect([korean.letterOffer, korean.eventNotice]).toEqual([true, true]);
    expect([japanese.letterOffer, japanese.eventNotice]).toEqual([
      false,
      false,
    ]);
  });
});

describe('decideOffers — 판매가 끝난 한국어 화면', () => {
  it('환급 판매·친구 초대·프리뷰 판정이 일본어 화면과 같다', () => {
    const { rewardSale, referral, previewFlow } = decideOffers(
      environment({ now: UNTIL }),
    );
    const japanese = decideOffers(environment({ locale: 'ja' }));

    expect({ rewardSale, referral, previewFlow }).toEqual({
      rewardSale: japanese.rewardSale,
      referral: japanese.referral,
      previewFlow: japanese.previewFlow,
    });
  });
});
