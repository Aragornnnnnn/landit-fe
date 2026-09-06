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

  it('외부 유입 딱지(UTM)를 지운 주소 변화는 같은 화면이라 다시 쏘지 않는다', () => {
    // 알림·위젯으로 들어온 첫 화면은 유입 속성을 싣고 한 번 쏜다
    const { rerender } = visit(
      '/scenario',
      'utm_source=push&utm_medium=notification&utm_campaign=daily_scenario_reminder',
    );
    expect(mocks.track).toHaveBeenLastCalledWith(
      'Page Viewed',
      expect.objectContaining({ entry_campaign: 'daily_scenario_reminder' }),
    );

    // 화면이 UTM을 주소에서 지우면(뒤로가기 재소환 방지) 라우터가 같은 화면을 다시 그린다
    mocks.search = '';
    rerender(<PageViewTracker />);

    expect(mocks.track).toHaveBeenCalledTimes(1);
  });

  it('딱지를 지운 뒤 같은 알림을 또 탭하면 새 유입으로 쏜다', () => {
    const utm =
      'utm_source=push&utm_medium=notification&utm_campaign=daily_scenario_reminder';
    const { rerender } = visit('/scenario', utm);
    mocks.search = '';
    rerender(<PageViewTracker />);

    mocks.search = utm;
    rerender(<PageViewTracker />);

    expect(mocks.track).toHaveBeenCalledTimes(2);
  });

  it('보고 있던 화면에 알림으로 다시 들어오면(웜 딥링크) 유입을 쏜다', () => {
    const { rerender } = visit('/scenario', '');
    mocks.search =
      'utm_source=push&utm_medium=notification&utm_campaign=daily_scenario_reminder';

    rerender(<PageViewTracker />);

    expect(mocks.track).toHaveBeenCalledTimes(2);
  });

  it('같은 화면이라도 속성이 달라지는 주소 변화는 쏜다', () => {
    const { rerender } = visit('/scenario', '');
    mocks.search = 'date=2026-08-01';

    rerender(<PageViewTracker />);

    expect(mocks.track).toHaveBeenCalledTimes(2);
  });
});
