// 환급 페이월 미리보기 — 개발자 묶음에서 열 때는 결제 금액 안내 노출을 찍지 않아 실험 지표가 섞이지 않는다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildRewardPlan } from '../_model/paywall-content';
import { RewardPaywall } from './RewardPaywall';

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
    <RewardPaywall
      plan={buildRewardPlan(50_000)}
      startStep={startStep}
      busy={false}
      onClose={onClose}
      onRestore={vi.fn()}
      onPurchase={vi.fn()}
      preview={preview}
    />,
  );

describe('RewardPaywall', () => {
  it('결제 금액 안내로 넘어가면 노출 이벤트를 찍는다', () => {
    renderPaywall();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mocks.track).toHaveBeenCalledWith('Paywall Checkout Viewed', {
      plan: 'pass',
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

describe('RewardPaywall 아래로 더 있다는 안내', () => {
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
