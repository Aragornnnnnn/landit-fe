// 페이월 화면 동작 — 플랜을 바꾸면 CTA·안내가 따라 바뀌고, 결제·복원·닫기가 제자리로 간다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaywallScreen } from './PaywallScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  track: vi.fn(),
  purchase: vi.fn(),
  restore: vi.fn(),
  busy: false,
  pricing: {} as Record<string, unknown>,
  purchaseOptions: null as { pricing: unknown; onUnlocked: () => void } | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// 결제 지휘는 features/subscription 몫 — 여기선 무엇을 넘기고 어떤 인자로 부르는지, 버튼 상태만 본다
vi.mock('@/features/subscription/model/usePurchase', () => ({
  usePurchase: (options: { pricing: unknown; onUnlocked: () => void }) => {
    mocks.purchaseOptions = options;
    return {
      busy: mocks.busy,
      purchase: mocks.purchase,
      restore: mocks.restore,
    };
  },
}));
vi.mock('@/features/subscription/model/useOfferings', () => ({
  useOfferings: () => mocks.pricing,
}));
// next/link는 next 밑의 다른 react 복사본을 잡아 훅이 깨진다 — 순수 a 태그로 치환한다
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
// next/image는 최적화 로더가 필요해 순수 img로 치환한다
vi.mock('next/image', () => ({
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

beforeEach(() => {
  mocks.busy = false;
  mocks.pricing = {};
  mocks.purchaseOptions = null;
});
afterEach(() => cleanup());

describe('PaywallScreen', () => {
  it('처음엔 연간이 선택돼 있어 CTA가 무료 체험 문구다', () => {
    render(<PaywallScreen />);

    expect(screen.getByRole('button', { name: '연간 플랜' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: '7일 무료 체험 시작하기' }),
    ).toBeInTheDocument();
  });

  it('월간 카드를 누르면 CTA와 결제 안내가 월간용으로 바뀌고 선택 이벤트를 찍는다', () => {
    render(<PaywallScreen />);

    fireEvent.click(screen.getByRole('button', { name: '월간 플랜' }));

    expect(
      screen.getByRole('button', { name: '월 14,900원으로 시작하기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('매월 14,900원 자동 결제 · 언제든 해지 가능'),
    ).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Paywall Plan Selected', {
      plan: 'monthly',
    });
  });

  it('이미 선택된 카드를 다시 눌러도 선택 이벤트는 찍지 않는다', () => {
    render(<PaywallScreen />);

    fireEvent.click(screen.getByRole('button', { name: '연간 플랜' }));

    expect(mocks.track).not.toHaveBeenCalled();
  });

  it('CTA를 누르면 결제 시작 이벤트를 찍고 고른 플랜으로 결제를 요청한다', () => {
    render(<PaywallScreen />);

    fireEvent.click(
      screen.getByRole('button', { name: '7일 무료 체험 시작하기' }),
    );

    expect(mocks.track).toHaveBeenCalledWith('Purchase Started', {
      plan: 'yearly',
    });
    expect(mocks.purchase).toHaveBeenCalledWith('yearly');
  });

  it('셸이 준 가격표는 표시에 쓰고 결제 훅에도 그대로 넘긴다', () => {
    mocks.pricing = {
      yearly: { packageId: '$rc_annual_kr', price: 49_900, currency: 'KRW' },
    };
    render(<PaywallScreen />);

    expect(
      screen.getByText('7일 무료 체험 후 연 49,900원 · 언제든 해지 가능'),
    ).toBeInTheDocument();
    expect(mocks.purchaseOptions?.pricing).toBe(mocks.pricing);
  });

  it('결제가 진행 중이면 CTA와 복원이 잠긴다', () => {
    mocks.busy = true;
    render(<PaywallScreen />);

    expect(screen.getByRole('button', { name: '구매 복원' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '구매 복원' }));
    expect(mocks.restore).not.toHaveBeenCalled();
  });

  it('구매 복원을 누르면 복원 이벤트를 찍고 복원을 요청한다', () => {
    render(<PaywallScreen />);

    fireEvent.click(screen.getByRole('button', { name: '구매 복원' }));

    expect(mocks.track).toHaveBeenCalledWith('Purchase Restore Tapped');
    expect(mocks.restore).toHaveBeenCalledTimes(1);
  });

  it('유료가 확인되면 게이트가 붙여 준 곳으로 돌아간다', () => {
    render(<PaywallScreen returnTo="/conversation/scenario/7/expressions" />);

    mocks.purchaseOptions?.onUnlocked();

    expect(mocks.replace).toHaveBeenCalledWith(
      '/conversation/scenario/7/expressions',
    );
  });

  it('돌아갈 곳이 없으면 유료가 돼도 홈으로 간다', () => {
    render(<PaywallScreen />);

    mocks.purchaseOptions?.onUnlocked();

    expect(mocks.replace).toHaveBeenCalledWith('/scenario');
  });

  it('닫기를 누르면 홈으로 돌아간다', () => {
    render(<PaywallScreen />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(mocks.replace).toHaveBeenCalledWith('/scenario');
  });
});
