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
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
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

const open = (override: Partial<OfferingTiers> = {}, expired = false) =>
  render(
    <PromoSheet
      promo={expired ? { ...promo, remainingSeconds: 0 } : promo}
      expired={expired}
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
    expect(screen.getByText('94,800원')).toBeInTheDocument();
    expect(screen.getByText('58,500원 /년')).toBeInTheDocument();
    expect(screen.getByText('38% 할인')).toBeInTheDocument();
    expect(screen.getByText('02:45 후 종료')).toBeInTheDocument();
  });

  it('월간도 1년치로 보여준다 — 같은 자로 재야 연간이 얼마나 싼지 읽힌다', () => {
    open();

    expect(screen.getByText('월 14,900원')).toBeInTheDocument();
    expect(screen.getByText('178,800원 /년')).toBeInTheDocument();
  });

  it('체험 포함 여부를 카드마다 밝힌다 — 월간에는 체험이 없다', () => {
    open();

    expect(screen.getByText('7일 무료 체험 포함')).toBeInTheDocument();
    expect(screen.getByText('무료 체험 미포함')).toBeInTheDocument();
  });

  it('닫기 버튼으로도 나갈 수 있다 — 딤 말고 눈에 보이는 길', () => {
    const onClose = vi.fn();
    render(
      <PromoSheet
        promo={promo}
        expired={false}
        tiers={tiers}
        onClose={onClose}
        onUnlocked={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalled();
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
    expect(screen.queryByRole('button', { name: /시작하기/ })).toBeNull();
    expect(screen.queryByText(/월 4,900원/)).toBeNull();
  });

  it('월간을 고르면 CTA와 결제 안내가 월간용으로 바뀐다 — 할인은 연간에만 있다', () => {
    open();

    fireEvent.click(screen.getByRole('button', { name: '월간 플랜' }));

    expect(
      screen.getByRole('button', { name: '월 14,900원으로 시작하기' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /할인 받고/ })).toBeNull();
    expect(
      screen.getByText('매월 14,900원 정기 결제 · 언제든 해지 가능'),
    ).toBeInTheDocument();
  });

  it('만료되면 스스로 닫는다 — 끝난 할인을 띄워 두지 않는다', () => {
    const onClose = vi.fn();
    render(
      <PromoSheet
        promo={{ ...promo, remainingSeconds: 0 }}
        expired
        tiers={tiers}
        onClose={onClose}
        onUnlocked={vi.fn()}
      />,
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('결제할 수 있는 화면이라 해지 안내와 약관 링크를 단다', () => {
    open();

    expect(
      screen.getByText('체험 종료 24시간 전까지 해지하면 청구되지 않아요'),
    ).toBeInTheDocument();
    expect(screen.getByText('이용약관')).toBeInTheDocument();
    expect(screen.getByText('개인정보 처리방침')).toBeInTheDocument();
  });

  it('정가 연간을 못 받았으면 아무것도 그리지 않는다 — 지어낸 정가로 할인이라 부르지 않는다', () => {
    open({ list: { monthly: tiers.list.monthly } });

    expect(screen.queryByText('월 4,900원')).toBeNull();
    expect(screen.queryByRole('button', { name: /시작하기/ })).toBeNull();
  });
});
