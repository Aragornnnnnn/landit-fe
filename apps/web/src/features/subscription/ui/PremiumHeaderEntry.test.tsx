// 헤더 왼쪽 자리 — 언제 알약이고 언제 로고인지, 할인 중에는 무엇을 보여주는지
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import type { MySubscription } from '../api/subscription';
import {
  clearPromoHandoff,
  handOffPromo,
} from '../model/exit-promo/promo-handoff';
import { PremiumHeaderEntry } from './PremiumHeaderEntry';

const mocks = vi.hoisted(() => ({
  paymentLive: true,
  subscription: null as MySubscription | null,
  isPending: false,
  isError: false,
  push: vi.fn(),
  onUnlocked: null as ((reason: 'purchase' | 'restore') => void) | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('../model/exit-promo/promo-flag', () => ({ PROMO_ENABLED: true }));
vi.mock('./exit-promo/PromoSheet', () => ({
  PromoSheet: ({
    open,
    onUnlocked,
  }: {
    open: boolean;
    onUnlocked: (reason: 'purchase' | 'restore') => void;
  }) => {
    mocks.onUnlocked = onUnlocked;
    return <div data-testid="promo-sheet" data-open={String(open)} />;
  },
}));
vi.mock('../model/paywall-gate/usePaymentLive', () => ({
  usePaymentLive: () => mocks.paymentLive,
}));
vi.mock('../model/my-subscription/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => ({
    subscription: mocks.subscription,
    isPending: mocks.isPending,
    isError: mocks.isError,
  }),
}));
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

const free = (promo: MySubscription['promo'] = null): MySubscription => ({
  premium: false,
  subscriptionStatus: 'NONE',
  periodType: null,
  expiresAt: null,
  promo,
});

beforeEach(() => {
  mocks.paymentLive = true;
  mocks.subscription = free();
  mocks.isPending = false;
  mocks.isError = false;
  mocks.push.mockClear();
  vi.mocked(track).mockClear();
  mocks.onUnlocked = null;
  clearPromoHandoff();
});
afterEach(() => cleanup());

describe('PremiumHeaderEntry', () => {
  it('무료 사용자에게는 프리미엄 진입 알약을 보여준다', () => {
    render(<PremiumHeaderEntry />);

    expect(screen.getByText('시작하기')).toBeInTheDocument();
  });

  it('할인 중에는 남은 시간을 보여준다', () => {
    mocks.subscription = free({
      remainingSeconds: 165,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    });
    render(<PremiumHeaderEntry />);

    // 자리마다 따로 그려 글자가 쪼개진다 — 합친 문자열로 본다
    expect(document.body.textContent).toContain('02:45');
  });

  it('유료 사용자에게는 로고를 그린다 — 팔 것이 없다', () => {
    mocks.subscription = { ...free(), premium: true };
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });

  it('결제를 시킬 수 없는 환경에서도 로고를 그린다 — 눌러도 살 수 없다', () => {
    mocks.paymentLive = false;
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });

  it('구독 상태를 받는 중이면 로고를 그린다 — 결제한 사람에게 업셀이 잠깐이라도 보이면 안 된다', () => {
    mocks.subscription = null;
    mocks.isPending = true;
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });

  it('구독 조회가 실패해도 로고를 그린다 — 유료인지 모르는 채로 팔지 않는다', () => {
    mocks.subscription = null;
    mocks.isError = true;
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });

  it('부르는 쪽이 무엇을 놓을지 아직 모르면 로고로 기다린다', () => {
    render(<PremiumHeaderEntry holding />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
    expect(screen.queryByText('시작하기')).not.toBeInTheDocument();
  });

  it('진입을 다른 곳으로 돌리면 그 주소와 글자로 알약을 그린다', () => {
    render(
      <PremiumHeaderEntry invite={{ href: '/refund', label: '환급받기' }} />,
    );

    expect(screen.getByText('환급받기').closest('a')).toHaveAttribute(
      'href',
      '/refund',
    );
  });

  it('할인 중에는 진입을 돌려도 할인 배지가 먼저다', () => {
    mocks.subscription = free({
      remainingSeconds: 165,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    });

    render(
      <PremiumHeaderEntry invite={{ href: '/refund', label: '환급받기' }} />,
    );

    expect(screen.queryByText('환급받기')).not.toBeInTheDocument();
  });

  it('돌린 진입을 눌러도 페이월 진입으로 세지 않는다', () => {
    render(
      <PremiumHeaderEntry invite={{ href: '/refund', label: '환급받기' }} />,
    );

    fireEvent.click(screen.getByText('환급받기'));

    expect(track).not.toHaveBeenCalled();
  });

  it('페이월로 가는 진입을 누르면 진입으로 센다', () => {
    render(<PremiumHeaderEntry />);

    fireEvent.click(screen.getByText('시작하기'));

    expect(track).toHaveBeenCalledWith(expect.any(String), {
      source: 'header',
    });
  });

  it('페이월에서 넘겨받으면 시트가 저절로 열린다 — 닫고 홈으로 보낸 뒤 한 번 더 권하는 자리다', () => {
    mocks.subscription = free({
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    });
    handOffPromo({
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    });
    render(<PremiumHeaderEntry />);

    expect(screen.getByTestId('promo-sheet')).toHaveAttribute(
      'data-open',
      'true',
    );
  });

  it('넘겨받은 게 없으면 시트는 닫힌 채로 붙어만 있다 — 스토어 가격을 미리 받아 둔다', () => {
    mocks.subscription = free({
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    });
    render(<PremiumHeaderEntry />);

    expect(screen.getByTestId('promo-sheet')).toHaveAttribute(
      'data-open',
      'false',
    );
  });

  it('할인 시트에서 결제하면 시트를 닫고 보던 화면을 쿼리까지 들고 프리미엄 온보딩으로 간다', () => {
    window.history.replaceState(null, '', '/scenario?date=2026-10-08');
    const promo = {
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    };
    mocks.subscription = free(promo);
    handOffPromo(promo);
    render(<PremiumHeaderEntry />);

    act(() => mocks.onUnlocked?.('purchase'));

    expect(mocks.push).toHaveBeenCalledWith(
      '/premium/onboarding?from=%2Fscenario%3Fdate%3D2026-10-08',
    );
    expect(screen.getByTestId('promo-sheet')).toHaveAttribute(
      'data-open',
      'false',
    );
  });

  it('할인 시트에서 복원하면 시트만 닫고 이동하지 않는다', () => {
    const promo = {
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    };
    mocks.subscription = free(promo);
    handOffPromo(promo);
    render(<PremiumHeaderEntry />);

    act(() => mocks.onUnlocked?.('restore'));

    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByTestId('promo-sheet')).toHaveAttribute(
      'data-open',
      'false',
    );
  });

  it('결제하는 사이 다른 조회로 유료가 먼저 들어와도 열린 시트는 남는다 — 결제 결과를 받아 프리미엄 온보딩으로 가야 한다', () => {
    // given — 할인 시트가 열린 채 결제 중
    const promo = {
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
    };
    mocks.subscription = free(promo);
    handOffPromo(promo);
    const { rerender } = render(<PremiumHeaderEntry />);

    // when — 포커스 복귀 재조회 등으로 구독이 먼저 유료가 된다
    mocks.subscription = {
      ...free(),
      premium: true,
      subscriptionStatus: 'ACTIVE',
    };
    rerender(<PremiumHeaderEntry />);

    // then — 로고로 바뀌어도 시트는 그대로 열려 있다
    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
    expect(screen.getByTestId('promo-sheet')).toHaveAttribute(
      'data-open',
      'true',
    );
  });
});
