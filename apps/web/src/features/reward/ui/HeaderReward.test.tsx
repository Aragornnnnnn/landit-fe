// 헤더 환급 알약 검증 — 색은 오늘 몫을 받았는지로만 갈린다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RewardBadge } from '../model/reward-status';
import { HeaderReward, RewardInviteLabel } from './HeaderReward';

// next/link·next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderStreak 테스트와 같은 이유)
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));
const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));
// 동전 연출은 그림이라 자리만 채운다 — 여기서는 언제 뜨는지와 그동안 알약이 무엇을 적는지만 본다
vi.mock('./common/CoinShower', () => ({
  CoinShower: ({ onEnd }: { onEnd: () => void }) => (
    <button type="button" onClick={onEnd}>
      동전 연출
    </button>
  ),
}));

const badge = (patch: Partial<RewardBadge> = {}): RewardBadge => ({
  label: '쌓인 환급액',
  amountWon: 1882,
  note: '오늘의 시나리오가 남았어요',
  mood: 'idle',
  ...patch,
});
const pill = () => screen.getByRole('link');
const renderPill = (
  props: Partial<React.ComponentProps<typeof HeaderReward>> = {},
) =>
  render(
    <HeaderReward
      badge={badge()}
      gain={null}
      onGainEnd={() => {}}
      {...props}
    />,
  );
const GAINED = {
  badge: badge({ amountWon: 2347, mood: 'kept' }),
  gain: { fromWon: 2015, toWon: 2347 },
};

afterEach(cleanup);

describe('HeaderReward', () => {
  it('쌓인 금액을 보여 주고 환급 화면으로 간다', () => {
    renderPill();

    expect(pill()).toHaveTextContent('1,882원');
    expect(pill()).toHaveAttribute('href', '/reward');
  });

  it('금액과 지금 상태를 함께 읽어 준다', () => {
    renderPill();

    expect(pill()).toHaveAccessibleName(
      '쌓인 환급액 1,882원, 오늘의 시나리오가 남았어요, 환급 보기',
    );
  });

  it('금액을 모르면 확인 중이라고 적는다', () => {
    renderPill({ badge: badge({ amountWon: null, mood: 'kept' }) });

    expect(pill()).toHaveTextContent('확인 중');
  });

  it('오늘 몫을 받았으면 금빛이다', () => {
    renderPill({ badge: badge({ mood: 'kept' }) });

    expect(pill()).toHaveClass('animate-gold-flow');
  });

  it('오늘의 시나리오가 아직이면 쌓인 금액이 있어도 회색으로 식을 뿐 급한 색을 띠지 않는다', () => {
    renderPill();

    expect(pill()).toHaveClass('bg-secondary');
    expect(pill()).not.toHaveClass('bg-destructive');
  });

  it('늘어난 금액이 있으면 동전 연출이 도는 동안 예전 금액으로 기다린다', () => {
    renderPill(GAINED);

    expect(screen.getByText('동전 연출')).toBeInTheDocument();
    expect(pill()).toHaveTextContent('2,015원');
  });

  it('연출이 끝나면 부르는 쪽에 알린다', () => {
    const onGainEnd = vi.fn();
    renderPill({ ...GAINED, onGainEnd });

    fireEvent.click(screen.getByText('동전 연출'));

    expect(onGainEnd).toHaveBeenCalled();
  });

  it('연출을 눌러 끝내도 알약을 누른 것으로 치지 않는다', () => {
    // given — 알약은 환급 화면으로 가는 링크다. 어둠을 누른 것이 링크까지 올라가면 화면이 넘어간다
    const onLinkClick = vi.fn();
    renderPill(GAINED);
    pill().addEventListener('click', onLinkClick);

    fireEvent.click(screen.getByText('동전 연출'));

    expect(onLinkClick).not.toHaveBeenCalled();
  });
});

describe('HeaderReward 계측', () => {
  it('알약을 누르면 헤더에서 환급으로 들어갔다고 찍는다', () => {
    renderPill();

    fireEvent.click(pill());

    expect(analytics.track.mock.calls).toEqual([
      ['Reward Entry Tapped', { source: 'header' }],
    ]);
  });
});

describe('RewardInviteLabel', () => {
  it('받을 금액이면 「받으러 가기」로 말한다', () => {
    render(<RewardInviteLabel amountWon={500} />);

    expect(screen.getByText('받으러 가기')).toBeInTheDocument();
  });

  it('놓친 금액이면 「놓쳤어요」로 말한다', () => {
    render(<RewardInviteLabel amountWon={15_500} missed />);

    expect(screen.getByText('15,500원')).toBeInTheDocument();
    expect(screen.getByText('놓쳤어요')).toBeInTheDocument();
  });

  it('보관 중인 돈이 있으면 놓친 금액보다 그 금액을 먼저 말한다', () => {
    render(<RewardInviteLabel amountWon={1_000} missed storedWon={3_000} />);

    expect(screen.getByText('3,000원')).toBeInTheDocument();
    expect(screen.getByText('쌓여 있어요')).toBeInTheDocument();
    expect(screen.queryByText('놓쳤어요')).not.toBeInTheDocument();
  });
});
