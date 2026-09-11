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
  ...overrides,
});

describe('toCardTitle', () => {
  it('구독 중이고 플랜을 알면 플랜을 앞에 붙이고, 모르면 상태만 말한다', () => {
    expect(toCardTitle(active({ plan: 'yearly' }))).toBe(
      '연간 프리미엄을 쓰고 있어요',
    );
    expect(toCardTitle(active())).toBe('프리미엄을 쓰고 있어요');
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

  it('날짜가 없으면 행이 없다', () => {
    expect(toDateRow(active({ expiresAt: null }))).toBeNull();
  });
});

describe('toAmountRow', () => {
  it('연간은 월간 1년치를 비교가로, 월간은 금액만', () => {
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
