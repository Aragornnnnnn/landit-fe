// 이탈 할인 시트 — 무엇을 보여주고, 어느 패키지로 결제가 가는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaywallPromo } from '../api/subscription';
import type { OfferingTiers } from '../model/offerings';
import { PromoSheet } from './PromoSheet';

const mocks = vi.hoisted(() => ({
  purchase: vi.fn(),
  track: vi.fn(),
  purchaseOptions: null as { pricing: unknown } | null,
}));

vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('../model/usePurchase', () => ({
  usePurchase: (options: { pricing: unknown }) => {
    mocks.purchaseOptions = options;
    return { busy: false, purchase: mocks.purchase, restore: vi.fn() };
  },
}));

const promo: PaywallPromo = {
  remainingSeconds: 165,
  expiresAt: '2026-09-22T14:35:00',
  newUser: true,
  campaignKey: 'exit-5min-2026-09',
};

const tiers: OfferingTiers = {
  list: {
    monthly: { packageId: '$rc_monthly', price: 14_900, currency: 'KRW' },
    yearly: { packageId: '$rc_annual', price: 94_800, currency: 'KRW' },
  },
  promo: {
    yearly: { packageId: 'annual_discount', price: 58_500, currency: 'KRW' },
  },
};

const open = (override: Partial<OfferingTiers> = {}) =>
  render(
    <PromoSheet
      open
      promo={promo}
      tiers={{ ...tiers, ...override }}
      onClose={vi.fn()}
      onUnlocked={vi.fn()}
    />,
  );

beforeEach(() => {
  mocks.purchaseOptions = null;
  vi.clearAllMocks();
});
afterEach(() => cleanup());

describe('PromoSheet', () => {
  it('할인가와 정가 비교선, 할인율, 남은 시간을 보여준다', () => {
    open();

    expect(screen.getByText('월 4,900원')).toBeInTheDocument();
    expect(screen.getByText('월 7,900원')).toBeInTheDocument();
    expect(screen.getByText('38% 할인')).toBeInTheDocument();
    expect(screen.getByText('02:45 후 종료')).toBeInTheDocument();
  });

  it('연간은 할인 패키지로, 월간은 정가 패키지로 결제가 간다', () => {
    open();

    expect(mocks.purchaseOptions?.pricing).toEqual({
      yearly: tiers.promo.yearly,
      monthly: tiers.list.monthly,
    });
  });

  it('CTA를 누르면 고른 플랜으로 결제를 요청하고 계측에 할인을 남긴다', () => {
    open();

    fireEvent.click(screen.getByRole('button', { name: /할인 받고 시작하기/ }));

    expect(mocks.purchase).toHaveBeenCalledWith('yearly');
    expect(mocks.track).toHaveBeenCalledWith('Purchase Started', {
      plan: 'yearly',
      promo_campaign: 'exit-5min-2026-09',
    });
  });

  it('할인 패키지가 없으면 아무것도 그리지 않는다 — 할인가를 보여 놓고 정가로 결제되면 안 된다', () => {
    open({ promo: {} });

    expect(screen.queryByText(/후 종료/)).not.toBeInTheDocument();
  });

  it('정가 연간을 못 받았으면 비교선과 할인율을 뺀다 — 지어낸 정가를 보여주지 않는다', () => {
    open({ list: { monthly: tiers.list.monthly } });

    expect(screen.getByText('월 4,900원')).toBeInTheDocument();
    expect(screen.queryByText(/% 할인/)).not.toBeInTheDocument();
  });
});
