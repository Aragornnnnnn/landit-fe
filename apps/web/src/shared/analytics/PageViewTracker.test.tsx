// PageViewTracker — 같은 화면을 다시 그리는 주소 변화에 페이지뷰가 부풀지 않는지 검증
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PageViewTracker } from './PageViewTracker';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  pathname: '/mailbox',
  search: '',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock('./amplitude', () => ({ track: mocks.track }));

// 주소를 갈아 끼우고 다시 그린다 — 실제 라우팅처럼 같은 트래커가 계속 살아 있는 상황
const visit = (pathname: string, search: string) => {
  mocks.pathname = pathname;
  mocks.search = search;
  return render(<PageViewTracker />);
};

describe('PageViewTracker', () => {
  beforeEach(() => {
    mocks.track.mockClear();
  });

  it('편지함에서 칸만 바꾸면 페이지뷰를 다시 쏘지 않는다', () => {
    const { rerender } = visit('/mailbox', '');
    mocks.search = 'box=sent';

    rerender(<PageViewTracker />);

    expect(mocks.track).toHaveBeenCalledTimes(1);
  });

  it('다른 화면을 거쳐 돌아오면 다시 쏜다', () => {
    const { rerender } = visit('/mailbox', '');

    mocks.pathname = '/me';
    rerender(<PageViewTracker />);
    mocks.pathname = '/mailbox';
    rerender(<PageViewTracker />);

    expect(mocks.track).toHaveBeenCalledTimes(3);
  });

  it('같은 화면이라도 속성이 달라지는 주소 변화는 쏜다', () => {
    const { rerender } = visit('/scenario', '');
    mocks.search = 'date=2026-08-01';

    rerender(<PageViewTracker />);

    expect(mocks.track).toHaveBeenCalledTimes(2);
  });
});
