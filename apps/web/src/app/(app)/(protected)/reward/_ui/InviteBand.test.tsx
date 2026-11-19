// 환급 화면의 친구 초대 띠 — 친구 초대가 열려 있을 때만 그려지는지 확인한다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InviteBand } from './InviteBand';

const mocks = vi.hoisted(() => ({ referral: true }));
vi.mock('@/features/subscription/model/offers/useOffers', () => ({
  useOffers: () => ({ referral: mocks.referral }),
}));
// 서버가 준 초대 조건 — 초대한 사람 몫이 켜져 있다
vi.mock('@/features/referral/model/useInviteOffer', () => ({
  useInviteOffer: () => ({
    offer: {
      inviterWon: 1000,
      inviteeWon: 5000,
      maxWon: 10000,
      creditedWon: 0,
      limit: { type: 'INVITE_COUNT', value: 10, used: 0, remaining: 10 },
    },
  }),
}));
// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children }: React.ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));

afterEach(() => {
  cleanup();
  mocks.referral = true;
});

describe('InviteBand', () => {
  it('친구 초대가 열려 있으면 초대 화면으로 가는 띠를 그린다', () => {
    render(<InviteBand />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/me/invite');
  });

  it('친구 초대가 닫혔으면 서버 조건이 켜져 있어도 띠를 그리지 않는다', () => {
    mocks.referral = false;
    render(<InviteBand />);

    expect(screen.queryByRole('link')).toBeNull();
  });
});
