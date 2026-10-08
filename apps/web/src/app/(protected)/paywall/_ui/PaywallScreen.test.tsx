// 페이월 화면 동작 — 플랜을 바꾸면 CTA·안내가 따라 바뀌고, 결제·복원·닫기가 제자리로 간다. 환급 챌린지 스위치를 켜면 환급 화면이 된다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaywallScreen } from './PaywallScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  track: vi.fn(),
  purchase: vi.fn(),
  restore: vi.fn(),
  busy: false,
  packages: {} as Record<string, unknown>,
  dismiss: vi.fn(),
  purchaseOptions: null as { packages: unknown; onUnlocked: () => void } | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// 닫기의 서버 알림·할인 전달은 usePaywallDismiss 몫 — 여기선 닫기가 그걸 부른 뒤 홈으로 가는지만 본다
vi.mock('@/features/subscription/model/exit-promo/usePaywallDismiss', () => ({
  usePaywallDismiss: () => mocks.dismiss,
}));
// 결제 지휘는 features/subscription 몫 — 여기선 무엇을 넘기고 어떤 인자로 부르는지, 버튼 상태만 본다
vi.mock('@/features/subscription/model/purchase/usePurchase', () => ({
  usePurchase: (options: { packages: unknown; onUnlocked: () => void }) => {
    mocks.purchaseOptions = options;
    return {
      busy: mocks.busy,
      purchase: mocks.purchase,
      restore: mocks.restore,
    };
  },
}));
vi.mock('@/features/subscription/model/product/useOffering', () => ({
  useOffering: () => ({ regular: mocks.packages, promo: {} }),
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
// 환급 챌린지는 기본 꺼짐 — 켠 화면은 refundChallenge로 따로 확인한다
vi.mock('@/features/subscription/model/paywall-gate/payment-flag', () => ({
  PAYMENT_ENABLED: true,
  REFUND_CHALLENGE_ENABLED: false,
}));
// 데모 속 캐릭터는 깜빡임·입모양을 WAAPI(element.animate)로 쏘는데 jsdom엔 없다 — 결제 흐름 테스트라 그림은 비운다
vi.mock('@/features/conversation/ui/character/PartnerCharacter', () => ({
  PartnerCharacter: () => null,
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
  mocks.purchaseOptions = null;
  mocks.dismiss = vi.fn().mockResolvedValue(undefined);
  mocks.packages = {
    yearly: { packageId: '$rc_annual', price: 94_500, currency: 'KRW' },
    monthly: { packageId: '$rc_monthly', price: 14_900, currency: 'KRW' },
  };
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
      screen.getByText('매월 14,900원 정기 결제 · 언제든 해지 가능'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '결제일 24시간 전까지 해지하면 다음 달은 청구되지 않아요',
      ),
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

  it('셸이 준 플랜별 패키지는 표시에 쓰고 결제 훅에도 그대로 넘긴다', () => {
    mocks.packages = {
      yearly: { packageId: '$rc_annual_kr', price: 49_900, currency: 'KRW' },
    };
    render(<PaywallScreen />);

    expect(
      screen.getByText(
        '7일 무료 체험 후 연 49,900원 정기 결제 · 언제든 해지 가능',
      ),
    ).toBeInTheDocument();
    expect(mocks.purchaseOptions?.packages).toBe(mocks.packages);
  });

  it('카드의 큰 숫자는 실제 청구액이고 월 환산가는 부제로만 쓴다 — 스토어 심사 3.1.2(c)', () => {
    mocks.packages = {
      yearly: { packageId: '$rc_annual_kr', price: 58_500, currency: 'KRW' },
    };
    render(<PaywallScreen />);

    expect(screen.getByText('연 58,500원')).toBeInTheDocument();
    expect(
      screen.getByText('월 4,900원꼴 · 7일 무료 체험'),
    ).toBeInTheDocument();
    expect(screen.queryByText('월 4,900원')).not.toBeInTheDocument();
  });

  it('플랜 칸이 화면에 다 보이지 않으면 CTA는 결제 대신 맨 아래로 내려 준다', () => {
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    const rect = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: Element) {
        const box = this.hasAttribute('data-plan-section')
          ? { top: 1200, bottom: 1700, height: 500 }
          : { top: 0, bottom: 800, height: 800 };
        return { ...box, left: 0, right: 0, width: 0, x: 0, y: 0 } as DOMRect;
      });
    render(<PaywallScreen />);

    fireEvent.click(
      screen.getByRole('button', { name: '7일 무료 체험 시작하기' }),
    );

    expect(scrollTo).toHaveBeenCalled();
    expect(mocks.purchase).not.toHaveBeenCalled();
    rect.mockRestore();
  });

  it('환급 챌린지가 꺼져 있으면 환급 문구 없이 지금 플랜 카드를 보여 준다', () => {
    render(<PaywallScreen />);

    expect(screen.queryByText('전액 환급')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '6개월 100% 환급 플랜' }),
    ).not.toBeInTheDocument();
  });

  it('환급 챌린지가 꺼져 있으면 「~에서만」 없이 프리미엄으로 배우는 법이라고 말한다 — 시나리오 대화는 무료에도 있다', () => {
    render(<PaywallScreen />);

    expect(
      screen.getByRole('heading', { name: /이렇게 배워요/ }),
    ).toBeInTheDocument();
  });

  it('구매 복원은 맨 위와 약관 옆 두 곳에 있다 — 스크롤해 내려가도 찾을 수 있다', () => {
    render(<PaywallScreen />);

    expect(screen.getAllByRole('button', { name: '구매 복원' })).toHaveLength(
      2,
    );
  });

  it('스크롤해 내려가면 닫기 버튼이 따로 떠 있다 — 언제든 닫을 수 있다', () => {
    const { container } = render(<PaywallScreen />);
    const root = container.querySelector('[data-scroll-root]')!;

    expect(screen.getAllByRole('button', { name: '닫기' })).toHaveLength(1);
    root.scrollTop = 600;
    fireEvent.scroll(root);

    expect(screen.getAllByRole('button', { name: '닫기' })).toHaveLength(2);
  });

  it('결제가 진행 중이면 CTA와 복원이 잠긴다', () => {
    mocks.busy = true;
    render(<PaywallScreen />);

    for (const restore of screen.getAllByRole('button', { name: '구매 복원' }))
      expect(restore).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: '구매 복원' })[0]);
    expect(mocks.restore).not.toHaveBeenCalled();
  });

  it('구매 복원을 누르면 복원 이벤트를 찍고 복원을 요청한다', () => {
    render(<PaywallScreen />);

    fireEvent.click(screen.getAllByRole('button', { name: '구매 복원' })[0]);

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

  it('닫기를 누르면 서버에 알린 뒤 홈으로 돌아간다', async () => {
    let finish = () => {};
    mocks.dismiss = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    render(<PaywallScreen />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(mocks.dismiss).toHaveBeenCalledTimes(1);
    expect(mocks.replace).not.toHaveBeenCalled();
    finish();
    await vi.waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/scenario'),
    );
  });
});

describe('PaywallScreen — 환급 챌린지가 켜졌을 때', () => {
  it('머리 제목은 「프리미엄에서만 할 수 있는 것들」이다', () => {
    render(<PaywallScreen refundChallenge />);

    expect(
      screen.getByRole('heading', { name: /할 수 있는 것들/ }),
    ).toBeInTheDocument();
  });

  it('처음엔 6개월(연간)이 선택돼 있어 CTA가 전액 환급 문구다', () => {
    render(<PaywallScreen refundChallenge />);

    expect(
      screen.getByRole('button', { name: '6개월 100% 환급 플랜' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: '6개월 전액 환급 도전하기' }),
    ).toBeInTheDocument();
  });

  it('3개월(월간) 카드를 누르면 CTA와 결제 안내가 3개월용으로 바뀐다', () => {
    render(<PaywallScreen refundChallenge />);

    fireEvent.click(
      screen.getByRole('button', { name: '3개월 80% 환급 플랜' }),
    );

    expect(
      screen.getByRole('button', { name: '3개월 80% 환급 도전하기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '3개월 39,900원 결제 · 챌린지 성공하면 최대 31,920원 환급',
      ),
    ).toBeInTheDocument();
  });

  it('CTA를 누르면 고른 플랜으로 결제를 요청한다', () => {
    render(<PaywallScreen refundChallenge />);

    fireEvent.click(
      screen.getByRole('button', { name: '6개월 전액 환급 도전하기' }),
    );

    expect(mocks.purchase).toHaveBeenCalledWith('yearly');
  });
});
