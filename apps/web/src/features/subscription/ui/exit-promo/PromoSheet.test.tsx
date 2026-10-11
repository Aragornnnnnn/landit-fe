// 할인 시트 껍데기 — 스토어 가격으로 시트를 만들 수 있을 때만 그리고, 못 만들면 그리지도 세지도 않는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaywallPromo } from '../../api/subscription';
import type { Offering } from '../../model/product/offering';
import { PromoSheet } from './PromoSheet';

const mocks = vi.hoisted(() => ({
  offering: { regular: {}, promo: {} } as Offering,
  track: vi.fn(),
}));

vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));
vi.mock('../../model/product/useOffering', () => ({
  useOffering: () => mocks.offering,
}));
vi.mock('../../model/purchase/usePurchase', () => ({
  usePurchase: () => ({ busy: false, purchase: vi.fn(), restore: vi.fn() }),
}));

const promo: PaywallPromo = {
  remainingSeconds: 165,
  expiresAt: '2026-09-22T14:35:00',
  newUser: true,
};

const full: Offering = {
  regular: {
    monthly: { packageId: '$rc_monthly', price: 14_900, currency: 'KRW' },
    yearly: { packageId: '$rc_annual', price: 94_500, currency: 'KRW' },
  },
  promo: {
    yearly: { packageId: 'annual_discount', price: 58_500, currency: 'KRW' },
  },
};

const open = () =>
  render(
    <PromoSheet
      open
      promo={promo}
      expired={false}
      onClose={vi.fn()}
      onUnlocked={vi.fn()}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.offering = full;
});
afterEach(() => cleanup());

describe('PromoSheet', () => {
  it('스토어 가격으로 시트를 만들 수 있으면 그리고 노출을 센다', () => {
    open();

    expect(
      screen.getByRole('button', { name: /할인 받고 시작하기/ }),
    ).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Promo Sheet Viewed', {
      new_user: true,
    });
  });

  it('할인 패키지가 없으면 그리지도 세지도 않는다 — 할인가를 보여 놓고 정가로 결제되면 안 된다', () => {
    mocks.offering = { ...full, promo: {} };
    open();

    expect(screen.queryByRole('button', { name: /시작하기/ })).toBeNull();
    expect(mocks.track).not.toHaveBeenCalledWith(
      'Promo Sheet Viewed',
      expect.anything(),
    );
  });

  it('정가 연간을 못 받았으면 그리지 않는다 — 지어낸 정가로 할인이라 부르지 않는다', () => {
    mocks.offering = { ...full, regular: { monthly: full.regular.monthly } };
    open();

    expect(screen.queryByRole('button', { name: /시작하기/ })).toBeNull();
  });
});
