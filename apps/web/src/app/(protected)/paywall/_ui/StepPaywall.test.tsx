// 단계형 페이월 — 환급 미리보기는 결제 금액 안내 노출을 찍지 않고, 일본어 화면은 환급 없이 월간·연간 구독을 판다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildPaywallPlans } from '@/features/subscription/model/product/plans';
import { setTestLocale } from '@/shared/i18n/test-locale';

import { buildRewardPlan, REVIEWS } from '../_model/paywall-content';
import { StepPaywall } from './StepPaywall';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// next/link는 next 밑의 다른 react 복사본을 잡아 훅이 깨진다 — 순수 a 태그로 치환한다
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
// 데모 속 캐릭터는 WAAPI(element.animate)를 쓰는데 jsdom엔 없다 — 그림은 비운다
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

// 단계를 넘기면 맨 위로 올리는데 jsdom 요소엔 scrollTo가 없다
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  mocks.track.mockClear();
});

const renderPaywall = ({
  preview,
  onClose = vi.fn(),
  startStep,
}: {
  preview?: boolean;
  onClose?: () => void;
  startStep?: 'benefits' | 'checkout';
} = {}) =>
  render(
    <StepPaywall
      offer={{ kind: 'pass', plan: buildRewardPlan(50_000) }}
      startStep={startStep}
      busy={false}
      onClose={onClose}
      onRestore={vi.fn()}
      onPurchase={vi.fn()}
      preview={preview}
    />,
  );

describe('StepPaywall', () => {
  it('결제 금액 안내로 넘어가면 노출 이벤트를 찍는다', () => {
    renderPaywall();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mocks.track).toHaveBeenCalledWith('Paywall Checkout Viewed', {
      plan: 'pass',
      entry_step: 'benefits',
    });
  });

  it('혜택 화면이 뜨면 노출을 찍고, 어느 문으로 왔는지 싣는다', () => {
    render(
      <StepPaywall
        offer={{ kind: 'pass', plan: buildRewardPlan(50_000) }}
        busy={false}
        source="premium_preview"
        onClose={vi.fn()}
        onRestore={vi.fn()}
        onPurchase={vi.fn()}
      />,
    );

    expect(mocks.track).toHaveBeenCalledWith('Paywall Benefits Viewed', {
      paywall_source: 'premium_preview',
    });
  });

  it('미리보기면 결제 금액 안내로 넘어가도 노출 이벤트를 찍지 않는다', () => {
    renderPaywall({ preview: true });

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText('100일 프리미엄 이용권')).toBeInTheDocument();
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it('혜택 화면에서 넘어온 결제 금액 안내는 뒤로 가면 혜택 화면으로 돌아간다', () => {
    const onClose = vi.fn();
    renderPaywall({ onClose });

    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }));

    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('결제 금액 안내부터 열었으면 닫기로 바로 닫는다 — 보지 않은 혜택 화면으로 되돌아가지 않는다', () => {
    const onClose = vi.fn();
    renderPaywall({ onClose, startStep: 'checkout' });

    expect(screen.queryByRole('button', { name: '뒤로' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('StepPaywall 리뷰 — 환급(한국어)', () => {
  it('스토어 평점 옆에 언제 기준인지 작게 적는다', () => {
    renderPaywall();

    expect(screen.getByText('(26년 10월 기준)')).toBeInTheDocument();
  });

  it('리뷰 아래에 리뷰 개수만큼 점을 두고 첫 점이 켜져 있다', () => {
    renderPaywall();

    const dots = screen.getAllByTestId('review-dot');
    expect(dots).toHaveLength(REVIEWS.length);
    expect(dots[0]).toHaveAttribute('data-active', 'true');
    expect(dots[1]).toHaveAttribute('data-active', 'false');
  });
});

describe('StepPaywall 아래로 더 있다는 안내', () => {
  afterEach(() => vi.useRealTimers());

  it('혜택 화면이 뜨자마자 한 번 살짝 내려갔다 돌아온다 — 아래에 혜택 4가지가 더 있다는 걸 보여 준다', () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    renderPaywall();

    act(() => vi.advanceTimersByTime(300));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 72, behavior: 'smooth' });

    act(() => vi.advanceTimersByTime(500));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('그 전에 이미 스크롤했으면 움찔하지 않는다', () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    const { container } = renderPaywall();
    const root = container.querySelector('[data-scroll-root]')!;

    root.scrollTop = 200;
    fireEvent.scroll(root);
    act(() => vi.advanceTimersByTime(2000));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('StepPaywall — 일본어 구독', () => {
  const plans = buildPaywallPlans({ monthly: 1_500, yearly: 9_800 }, 'JPY');
  const renderSubscription = (onSelect = vi.fn()) => {
    setTestLocale('ja');
    return render(
      <StepPaywall
        offer={{ kind: 'subscription', plans, selectedId: 'yearly', onSelect }}
        busy={false}
        onClose={vi.fn()}
        onRestore={vi.fn()}
        onPurchase={vi.fn()}
      />,
    );
  };

  it('혜택은 적립 없이 셋이고 한국 스토어 리뷰를 보여 주지 않는다', () => {
    renderSubscription();

    expect(screen.getByText('プレミアムだけの特典3つ')).toBeInTheDocument();
    expect(screen.queryByText(/적립/)).not.toBeInTheDocument();
    expect(screen.queryByText(REVIEWS[0].body)).not.toBeInTheDocument();
  });

  it('결제 단계는 월간·연간 카드와 고른 플랜의 결제 안내를 보여 준다', () => {
    const onSelect = vi.fn();
    renderSubscription(onSelect);

    fireEvent.click(screen.getByRole('button', { name: '次へ' }));

    expect(mocks.track).toHaveBeenCalledWith('Paywall Checkout Viewed', {
      plan: 'yearly',
      entry_step: 'benefits',
    });
    expect(
      screen.getByRole('button', { name: '7日間の無料体験を始める' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '7日間の無料体験後は年額9,800円で自動更新。いつでも解約できます',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '月間プラン' }));
    expect(onSelect).toHaveBeenCalledWith('monthly');
  });
});
