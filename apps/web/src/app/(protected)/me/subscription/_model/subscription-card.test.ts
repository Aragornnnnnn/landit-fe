// 골드 카드 문구 규칙 — 제목의 플랜, 상태별 날짜 라벨, 결제 금액과 비교가
import { describe, expect, it } from 'vitest';

import type { PaidSubscriptionSummary } from '@/features/subscription/model/subscription-summary';

import { toAmountRow, toCardTitle, toDateRow } from './subscription-card';

const active = (
  overrides: Partial<PaidSubscriptionSummary> = {},
): PaidSubscriptionSummary => ({
  kind: 'active',
  expiresAt: '2026-10-04T12:00:00',
  renews: true,
  plan: null,
  price: null,
  productId: null,
  ...overrides,
});

describe('toCardTitle', () => {
  it('구독 중이고 플랜을 알면 플랜을 앞에 붙이고, 모르면 상태만 말한다', () => {
    expect(toCardTitle(active({ plan: 'yearly' }))).toBe(
      '연간 프리미엄을 쓰고 있어요',
    );
    expect(toCardTitle(active())).toBe('프리미엄을 쓰고 있어요');
  });

  it('프로모션으로 받은 기간은 무료 체험과 같은 제목을 쓴다 — 돈을 안 내고 쓰는 건 같다', () => {
    expect(toCardTitle(active({ renews: false }))).toBe('무료 체험 중이에요');
  });

  it('체험·해지 예정은 플랜을 알아도 상태만 말한다', () => {
    expect(toCardTitle(active({ kind: 'trial', plan: 'yearly' }))).toBe(
      '무료 체험 중이에요',
    );
    expect(
      toCardTitle(active({ kind: 'canceled', renews: false, plan: 'yearly' })),
    ).toBe('해지가 예약됐어요');
  });
});

describe('toDateRow', () => {
  it('체험은 첫 결제일, 구독은 다음 결제일, 그날로 끝나면 만료일과 자동 갱신 꺼짐', () => {
    expect(toDateRow(active({ kind: 'trial' }))).toEqual({
      label: '첫 결제일',
      value: '2026년 10월 4일',
    });
    expect(toDateRow(active())).toEqual({
      label: '다음 결제일',
      value: '2026년 10월 4일',
    });
    expect(toDateRow(active({ kind: 'canceled', renews: false }))).toEqual({
      label: '이용 만료일',
      value: '2026년 10월 4일 · 자동 갱신 꺼짐',
    });
  });

  it('프로모션으로 받은 기간은 만료일만 말한다 — 끈 적 없는 자동 갱신을 껐다고 하지 않는다', () => {
    expect(toDateRow(active({ renews: false }))).toEqual({
      label: '이용 만료일',
      value: '2026년 10월 4일',
    });
  });

  it('날짜가 없으면 행이 없다', () => {
    expect(toDateRow(active({ expiresAt: null }))).toBeNull();
  });
});

describe('toAmountRow', () => {
  it('BE 금액이 없으면 등록값으로 그린다 — 금액 행이 사라지지 않게', () => {
    expect(toAmountRow(active({ plan: 'yearly' }))).toEqual({
      label: '다음 결제 금액',
      value: '58,500원',
      listPrice: '178,800원',
    });
    expect(toAmountRow(active({ plan: 'monthly' }))).toEqual({
      label: '다음 결제 금액',
      value: '14,900원',
      listPrice: undefined,
    });
  });

  it('적용되는 금액이 있으면 그 금액을 보여주고, 비교가는 월간 12개월치 그대로다', () => {
    expect(toAmountRow(active({ plan: 'yearly', price: 47000 }))).toEqual({
      label: '다음 결제 금액',
      value: '47,000원',
      listPrice: '178,800원',
    });
  });

  it('체험 중이라 결제액이 없으면 그 상품의 등록값으로 그린다 — 할인가 체험자에게 정가를 보여주지 않는다', () => {
    expect(
      toAmountRow(
        active({
          kind: 'trial',
          plan: 'yearly',
          productId: 'com.saynow.app.premium.yearly.discount',
        }),
      ),
    ).toMatchObject({ label: '첫 결제 금액', value: '58,500원' });
  });

  it('체험은 첫 결제 금액이고, 플랜을 모르거나 갱신이 안 되면 행이 없다', () => {
    expect(toAmountRow(active({ kind: 'trial', plan: 'yearly' }))?.label).toBe(
      '첫 결제 금액',
    );
    expect(toAmountRow(active())).toBeNull();
    expect(
      toAmountRow(active({ kind: 'canceled', renews: false, plan: 'yearly' })),
    ).toBeNull();
  });
});
