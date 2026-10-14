// LetterOfferCta — 지정한 편지에서, 혜택가를 팔 수 있는 무료 사용자에게만 버튼을 그리고 누르면 시트를 연다
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import type { Offering } from '../../model/product/offering';
import { LetterOfferCta } from './LetterOfferCta';

const mocks = vi.hoisted(() => ({
  offering: { regular: {}, promo: {} } as Offering,
  premium: false as boolean | null,
  purchase: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('../../model/product/useOffering', () => ({
  useOffering: () => mocks.offering,
}));
vi.mock('../../model/my-subscription/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => ({
    subscription: mocks.premium === null ? null : { premium: mocks.premium },
    isPending: false,
    isError: false,
  }),
}));
vi.mock('../../model/purchase/usePurchase', () => ({
  usePurchase: () => ({
    busy: false,
    purchase: mocks.purchase,
    restore: vi.fn(),
  }),
}));

const full: Offering = {
  regular: {
    yearly: { packageId: '$rc_annual', price: 94_500, currency: 'KRW' },
  },
  promo: {
    yearly: { packageId: 'annual_discount', price: 58_500, currency: 'KRW' },
  },
};

const ctaName = /프리미엄 혜택가 확인하기/;

const member = (nickname: string | null) => ({
  userId: 42,
  nickname,
  email: null,
  provider: 'KAKAO' as const,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_OFFER_LETTER_ID', '7');
  mocks.offering = full;
  mocks.premium = false;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('LetterOfferCta', () => {
  it('지정한 편지가 아니면 버튼을 그리지 않는다', () => {
    render(<LetterOfferCta letterId={8} />);

    expect(screen.queryByRole('button', { name: ctaName })).toBeNull();
  });

  it('이미 프리미엄이면 버튼을 그리지 않는다', () => {
    mocks.premium = true;

    render(<LetterOfferCta letterId={7} />);

    expect(screen.queryByRole('button', { name: ctaName })).toBeNull();
  });

  it('구독 상태를 아직 모르면 버튼을 그리지 않는다', () => {
    mocks.premium = null;

    render(<LetterOfferCta letterId={7} />);

    expect(screen.queryByRole('button', { name: ctaName })).toBeNull();
  });

  it('할인 패키지를 못 받았으면 버튼을 그리지 않는다 — 브라우저·구버전 셸도 여기에 걸린다', () => {
    mocks.offering = { regular: {}, promo: {} };

    render(<LetterOfferCta letterId={7} />);

    expect(screen.queryByRole('button', { name: ctaName })).toBeNull();
  });

  it('버튼을 누르면 혜택가 시트가 열리고, 시트의 결제 버튼은 연간을 결제한다', async () => {
    render(<LetterOfferCta letterId={7} />);

    await userEvent.click(screen.getByRole('button', { name: ctaName }));
    await userEvent.click(
      screen.getByRole('button', { name: /프리미엄 시작하기/ }),
    );

    expect(mocks.purchase).toHaveBeenCalledWith('yearly');
  });

  it('결제 중 구독이 유료로 바뀌어도 시트를 내리지 않는다 — 내리면 결제 결과를 받을 화면이 사라진다', async () => {
    const { rerender } = render(<LetterOfferCta letterId={7} />);
    await userEvent.click(screen.getByRole('button', { name: ctaName }));

    mocks.premium = true;
    rerender(<LetterOfferCta letterId={7} />);

    expect(
      screen.getByRole('button', { name: /프리미엄 시작하기/ }),
    ).toBeInTheDocument();
  });

  it('시트 라벨에 정가 연간 대비 할인율을 적는다', async () => {
    render(<LetterOfferCta letterId={7} />);

    await userEvent.click(screen.getByRole('button', { name: ctaName }));

    expect(screen.getByText('38% 혜택가')).toBeInTheDocument();
  });

  it('시트 제목에 닉네임을 넣는다', async () => {
    useAuthStore.setState({ member: member('준서') });
    render(<LetterOfferCta letterId={7} />);

    await userEvent.click(screen.getByRole('button', { name: ctaName }));

    expect(
      screen.getByRole('heading', { name: /준서님께만 드리는/ }),
    ).toBeInTheDocument();
  });

  it('닉네임이 없으면 제목을 회원님으로 부른다', async () => {
    useAuthStore.setState({ member: member(null) });
    render(<LetterOfferCta letterId={7} />);

    await userEvent.click(screen.getByRole('button', { name: ctaName }));

    expect(
      screen.getByRole('heading', { name: /회원님께만 드리는/ }),
    ).toBeInTheDocument();
  });
});
