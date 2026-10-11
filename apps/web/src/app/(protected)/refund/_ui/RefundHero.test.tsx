// 환급 히어로 계측 — 기간이 끝난 사람의 다시 시작 링크가 환급에서 페이월로 들어간 것으로 찍히는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  endedRewardView,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { RefundHero } from './RefundHero';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));
// next/link·next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderRefund 테스트와 같은 이유)
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));

afterEach(cleanup);

describe('RefundHero 계측', () => {
  it('기간이 끝난 사람이 다시 시작을 누르면 환급에서 페이월로 들어갔다고 찍는다', () => {
    render(<RefundHero reward={endedRewardView(31_920)} />);

    fireEvent.click(screen.getByRole('link', { name: /다시 시작하고/ }));

    expect(analytics.track.mock.calls).toEqual([
      ['Paywall Entry Tapped', { source: 'reward' }],
    ]);
  });

  it('쌓는 중인 사람에게는 다시 시작 링크가 없다', () => {
    render(<RefundHero reward={rewardView()} />);

    expect(screen.queryByRole('link', { name: /다시 시작하고/ })).toBeNull();
  });
});
