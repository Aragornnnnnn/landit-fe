// 헤더 환급 알약 검증 — 색은 오늘 한 일과 걸린 금액으로 갈리고, 남은 시간은 급할 때만 붙는다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RewardBadge } from '../model/reward-status';
import { HeaderRefund } from './HeaderRefund';

const mocks = vi.hoisted(() => ({ urgent: false }));

vi.mock('../model/useMidnightUrgent', () => ({
  useMidnightUrgent: (enabled: boolean) => enabled && mocks.urgent,
}));
// 자정까지 2시간 41분 54초
vi.mock('../model/useMidnightLeft', () => ({
  useMidnightLeft: () => (2 * 60 + 41) * 60_000 + 54_000,
}));
// next/link·next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderStreak 테스트와 같은 이유)
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));
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
  note: '오늘 아직 안 했어요',
  mood: 'atRisk',
  ...patch,
});
const pill = () => screen.getByRole('link');
const renderPill = (
  props: Partial<React.ComponentProps<typeof HeaderRefund>> = {},
) =>
  render(
    <HeaderRefund
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

beforeEach(() => {
  mocks.urgent = false;
});
afterEach(cleanup);

describe('HeaderRefund', () => {
  it('쌓인 금액을 보여 주고 환급 화면으로 간다', () => {
    renderPill();

    expect(pill()).toHaveTextContent('1,882원');
    expect(pill()).toHaveAttribute('href', '/refund');
  });

  it('금액과 지금 상태를 함께 읽어 준다', () => {
    renderPill();

    expect(pill()).toHaveAccessibleName(
      '쌓인 환급액 1,882원, 오늘 아직 안 했어요, 환급 보기',
    );
  });

  it('금액을 모르면 확인 중이라고 적는다', () => {
    renderPill({ badge: badge({ amountWon: null, mood: 'kept' }) });

    expect(pill()).toHaveTextContent('확인 중');
  });

  it('오늘 했으면 금빛이다', () => {
    renderPill({ badge: badge({ mood: 'kept' }) });

    expect(pill()).toHaveClass('animate-gold-flow');
  });

  it('걸린 금액이 있는데 오늘이 아직이면 회색으로 식는다', () => {
    renderPill();

    expect(pill()).toHaveClass('bg-secondary');
  });

  it('자정이 가까우면 남은 시간을 같이 말한다', () => {
    mocks.urgent = true;

    renderPill();

    expect(pill()).toHaveTextContent('2:42');
  });

  it('걸린 금액이 없으면 자정이 가까워도 급해지지 않는다', () => {
    mocks.urgent = true;

    renderPill({ badge: badge({ amountWon: 0, mood: 'idle' }) });

    expect(pill()).not.toHaveTextContent('2:42');
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
