// 골드 카드 문구 규칙 — 제목의 플랜, 상태별 날짜 라벨, 결제 금액과 비교가
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import type { PaidSubscriptionSummary } from '@/features/subscription/model/my-subscription/subscription-summary';
import ja from '@/shared/i18n/locales/ja';
import ko from '@/shared/i18n/locales/ko';

import { toAmountRow, toCardTitle, toDateRow } from './subscription-card';

const t = createTranslator({
  locale: 'ko',
  messages: ko,
  namespace: 'subscription',
});
const tJa = createTranslator({
  locale: 'ja',
  messages: ja,
  namespace: 'subscription',
});
// 한국어 화면 기준 — 아래 테스트 대부분이 이 셋으로 부른다
const cardTitleKo = (summary: PaidSubscriptionSummary) =>
  toCardTitle(summary, t);
const dateRowKo = (summary: PaidSubscriptionSummary) =>
  toDateRow(summary, t, 'ko');
const amountRowKo = (summary: PaidSubscriptionSummary) =>
  toAmountRow(summary, t);

const active = (
  overrides: Partial<PaidSubscriptionSummary> = {},
): PaidSubscriptionSummary => ({
  kind: 'active',
  expiresAt: '2026-10-04T12:00:00',
  renews: true,
  plan: null,
  price: null,
  ...overrides,
});

describe('toCardTitle', () => {
  it('구독 중이고 플랜을 알면 플랜을 앞에 붙이고, 모르면 상태만 말한다', () => {
    expect(cardTitleKo(active({ plan: 'yearly' }))).toBe(
      '연간 프리미엄을 쓰고 있어요',
    );
    expect(cardTitleKo(active({ plan: 'halfyear' }))).toBe(
      '6개월 프리미엄을 쓰고 있어요',
    );
    expect(cardTitleKo(active())).toBe('프리미엄을 쓰고 있어요');
  });

  it('프로모션으로 받은 기간은 무료 체험과 같은 제목을 쓴다 — 돈을 안 내고 쓰는 건 같다', () => {
    expect(cardTitleKo(active({ renews: false }))).toBe('무료 체험 중이에요');
  });

  it('100일 이용권은 받은 기간이 아니라 산 기간이라 이용권으로 부른다', () => {
    expect(cardTitleKo(active({ renews: false, plan: 'pass' }))).toBe(
      '100일 이용권을 쓰고 있어요',
    );
  });

  it('체험·해지 예정은 플랜을 알아도 상태만 말한다', () => {
    expect(cardTitleKo(active({ kind: 'trial', plan: 'yearly' }))).toBe(
      '무료 체험 중이에요',
    );
    expect(
      cardTitleKo(active({ kind: 'canceled', renews: false, plan: 'yearly' })),
    ).toBe('해지가 예약됐어요');
  });
});

describe('toDateRow', () => {
  it('체험은 첫 결제일, 구독은 다음 결제일, 그날로 끝나면 만료일과 자동 갱신 꺼짐', () => {
    expect(dateRowKo(active({ kind: 'trial' }))).toEqual({
      label: '첫 결제일',
      value: '2026년 10월 4일',
    });
    expect(dateRowKo(active())).toEqual({
      label: '다음 결제일',
      value: '2026년 10월 4일',
    });
    expect(dateRowKo(active({ kind: 'canceled', renews: false }))).toEqual({
      label: '이용 만료일',
      value: '2026년 10월 4일 · 자동 갱신 꺼짐',
    });
  });

  it('프로모션으로 받은 기간은 만료일만 말한다 — 끈 적 없는 자동 갱신을 껐다고 하지 않는다', () => {
    expect(dateRowKo(active({ renews: false }))).toEqual({
      label: '이용 만료일',
      value: '2026년 10월 4일',
    });
  });

  it('날짜가 없으면 행이 없다', () => {
    expect(dateRowKo(active({ expiresAt: null }))).toBeNull();
  });
});

describe('toAmountRow', () => {
  it('연간은 월간 1년치를 비교가로, 월간은 금액만', () => {
    expect(amountRowKo(active({ plan: 'yearly', price: 58_500 }))).toEqual({
      label: '다음 결제 금액',
      value: '58,500원',
      listPrice: '178,800원',
    });
    expect(amountRowKo(active({ plan: 'monthly', price: 14_900 }))).toEqual({
      label: '다음 결제 금액',
      value: '14,900원',
      listPrice: undefined,
    });
  });

  it('3·6개월은 비교가 없이 다음 결제 금액만 보여 준다', () => {
    expect(amountRowKo(active({ plan: 'halfyear', price: 59_900 }))).toEqual({
      label: '다음 결제 금액',
      value: '59,900원',
      listPrice: undefined,
    });
  });

  it('적용되는 금액이 있으면 그 금액을 보여주고, 비교가는 월간 12개월치 그대로다', () => {
    expect(amountRowKo(active({ plan: 'yearly', price: 47000 }))).toEqual({
      label: '다음 결제 금액',
      value: '47,000원',
      listPrice: '178,800원',
    });
  });

  it('실제 결제액을 모르면 금액 행이 없다 — 무료 체험 중엔 결제 이력이 없어 등록값으로 추측하지 않는다', () => {
    expect(amountRowKo(active({ kind: 'trial', plan: 'yearly' }))).toBeNull();
  });

  it('체험은 첫 결제 금액이고, 플랜을 모르거나 갱신이 안 되면 행이 없다', () => {
    expect(
      amountRowKo(active({ kind: 'trial', plan: 'yearly', price: 58_500 }))
        ?.label,
    ).toBe('첫 결제 금액');
    expect(amountRowKo(active())).toBeNull();
    expect(
      amountRowKo(active({ kind: 'canceled', renews: false, plan: 'yearly' })),
    ).toBeNull();
  });
});

describe('일본어 화면', () => {
  it('제목·날짜 행을 일본어로 적는다', () => {
    expect(toCardTitle(active({ plan: 'yearly' }), tJa)).toBe(
      '年間プレミアムを利用中です',
    );
    const canceled = active({
      kind: 'canceled',
      renews: false,
      plan: 'yearly',
    });
    expect(toDateRow(canceled, tJa, 'ja')).toEqual({
      label: '利用期限',
      value: '2026年10月4日・自動更新オフ',
    });
  });
});
