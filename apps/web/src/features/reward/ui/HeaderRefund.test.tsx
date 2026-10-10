// 헤더 환급 알약 검증 — 색은 오늘 한 일과 걸린 금액으로 갈리고, 남은 시간은 급할 때만 붙는다
import { cleanup, render, screen } from '@testing-library/react';
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

const badge = (patch: Partial<RewardBadge> = {}): RewardBadge => ({
  label: '쌓인 환급액',
  amountWon: 1882,
  note: '오늘 아직 안 했어요',
  mood: 'atRisk',
  ...patch,
});
const pill = () => screen.getByRole('link');

beforeEach(() => {
  mocks.urgent = false;
});
afterEach(cleanup);

describe('HeaderRefund', () => {
  it('쌓인 금액을 보여 주고 환급 화면으로 간다', () => {
    render(<HeaderRefund badge={badge()} />);

    expect(pill()).toHaveTextContent('1,882원');
    expect(pill()).toHaveAttribute('href', '/refund');
  });

  it('금액과 지금 상태를 함께 읽어 준다', () => {
    render(<HeaderRefund badge={badge()} />);

    expect(pill()).toHaveAccessibleName(
      '쌓인 환급액 1,882원, 오늘 아직 안 했어요, 환급 보기',
    );
  });

  it('금액을 모르면 확인 중이라고 적는다', () => {
    render(<HeaderRefund badge={badge({ amountWon: null, mood: 'kept' })} />);

    expect(pill()).toHaveTextContent('확인 중');
  });

  it('오늘 했으면 금빛이다', () => {
    render(<HeaderRefund badge={badge({ mood: 'kept' })} />);

    expect(pill()).toHaveClass('animate-gold-flow');
  });

  it('걸린 금액이 있는데 오늘이 아직이면 회색으로 식는다', () => {
    render(<HeaderRefund badge={badge()} />);

    expect(pill()).toHaveClass('bg-secondary');
  });

  it('자정이 가까우면 남은 시간을 같이 말한다', () => {
    mocks.urgent = true;

    render(<HeaderRefund badge={badge()} />);

    expect(pill()).toHaveTextContent('2:42');
  });

  it('걸린 금액이 없으면 자정이 가까워도 급해지지 않는다', () => {
    mocks.urgent = true;

    render(<HeaderRefund badge={badge({ amountWon: 0, mood: 'idle' })} />);

    expect(pill()).not.toHaveTextContent('2:42');
  });
});
