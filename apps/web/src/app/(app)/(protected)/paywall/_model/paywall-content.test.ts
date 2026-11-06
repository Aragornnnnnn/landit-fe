// 롱 페이월 고정 콘텐츠와 환급 챌린지 값의 계약 — 예문 카드는 짚을 표현이 문장 안에 그대로 있어야 주황 강조가 제자리에 앉는다
import { describe, expect, it } from 'vitest';

import {
  buildRewardPlan,
  EXAMPLE_CARDS,
  EXAMPLE_LANDING_INDEX,
  ratingAsOfLabel,
  REVIEWS,
  rewardBenefitsOf,
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

describe('ratingAsOfLabel', () => {
  it('평점을 확인한 날을 「(26년 10월 기준)」처럼 연·월로 줄인다', () => {
    expect(ratingAsOfLabel('2026.10.06')).toBe('(26년 10월 기준)');
    expect(ratingAsOfLabel('2027.03.01')).toBe('(27년 3월 기준)');
  });
});

describe('REVIEWS', () => {
  it('「원어민과 실제로 대화하는 느낌」 리뷰는 제목·작성자·날짜를 다른 카드처럼 갖춘다', () => {
    const review = REVIEWS.find(({ body }) =>
      body.startsWith('원어민과 실제로 대화하는 느낌'),
    );
    expect(review).toMatchObject({
      title: expect.any(String),
      author: '박 ****',
      date: '2026.09.16',
    });
  });
});

describe('buildRewardPlan', () => {
  it('스토어 가격이 없으면 5만 원 이용권 등록값으로 100일·하루 500원을 정한다', () => {
    expect(buildRewardPlan()).toEqual({
      days: 100,
      price: 50_000,
      dailyRefund: 500,
      maxRefund: 50_000,
    });
  });

  it.each([
    [30_000, 300],
    [100_000, 1_000],
    [200_000, 2_000],
  ])(
    '셸이 준 가격이 %i원이면 다 채웠을 때 그 금액을 돌려받고 하루 몫은 %i원이다 — 가격만 다른 이용권을 올려도 화면이 따라온다',
    (price, dailyRefund) => {
      expect(buildRewardPlan(price)).toMatchObject({
        price,
        dailyRefund,
        maxRefund: price,
      });
    },
  );

  it('일수로 나눠떨어지지 않는 가격이면 하루 몫을 내리고, 최대 환급액은 그 합이다 — 하루 몫 × 일수와 어긋나지 않는다', () => {
    expect(buildRewardPlan(55_550)).toMatchObject({
      dailyRefund: 555,
      maxRefund: 55_500,
    });
  });
});

describe('rewardBenefitsOf', () => {
  it('적립 줄에 하루 몫을 쓴다 — 가격이 바뀌면 줄도 따라간다', () => {
    expect(rewardBenefitsOf(300).map((row) => row.text)).toContain(
      '시나리오마다 300원 적립',
    );
  });

  it('맨 아래 줄은 프리미엄 전용 롤플레이다', () => {
    expect(rewardBenefitsOf(500).at(-1)).toEqual({
      text: '나만의 시나리오 만들기',
      free: false,
    });
  });

  it('무료로도 되는 줄은 매일 새 시나리오 하나뿐이고 맨 위에 있다', () => {
    const rows = rewardBenefitsOf(500);

    expect(rows.filter((row) => row.free).map((row) => row.text)).toEqual([
      '매일 새 시나리오',
    ]);
    expect(rows[0].free).toBe(true);
  });
});
