// TabBar — 고를 게 있을 때만 칩을 그리고, 현재 탭을 활성으로 표시하는지 검증
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { TabBar } from './TabBar';
import type { Tab } from './tabs';

const mocks = vi.hoisted(() => ({ pathname: '/scenario' }));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다(vitest.config의 별칭은 소스용).
// 여기서 검증할 건 주소·활성 표시·클릭이라 평범한 앵커로 대체한다 (jsdom엔 이동이 없어 기본 동작만 막는다)
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: React.ComponentProps<'a'>) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

const scenario: Tab = {
  id: 'scenario',
  href: '/scenario',
  label: '시나리오',
  ready: true,
};
const smalltalk: Tab = {
  id: 'smalltalk',
  href: '/smalltalk',
  label: '스몰톡',
  ready: true,
};

afterEach(cleanup);

describe('TabBar', () => {
  it('보이는 탭이 하나뿐이면 칩을 그리지 않는다', () => {
    // Given 시나리오 탭만 준비된 상태에서
    // When 셸이 탭 칩을 그리면
    const { container } = render(<TabBar tabs={[scenario]} />);

    // Then 고를 게 없으므로 아무것도 나오지 않는다
    expect(container).toBeEmptyDOMElement();
  });

  it('탭이 둘 이상이면 각 탭의 칩을 그린다', () => {
    // Given 시나리오와 스몰톡이 모두 준비된 상태에서
    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 두 칩이 각자의 주소를 가리킨다
    expect(screen.getByRole('link', { name: '시나리오' })).toHaveAttribute(
      'href',
      '/scenario',
    );
    expect(screen.getByRole('link', { name: '스몰톡' })).toHaveAttribute(
      'href',
      '/smalltalk',
    );
  });

  it('현재 보고 있는 탭의 칩만 활성으로 표시한다', () => {
    // Given 시나리오 탭을 보고 있는 상태에서
    mocks.pathname = '/scenario';

    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 시나리오 칩만 현재 페이지로 표시된다
    expect(screen.getByRole('link', { name: '시나리오' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '스몰톡' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('다른 탭 칩을 누르면 어느 탭으로 갔는지 남긴다', async () => {
    mocks.pathname = '/scenario';
    const user = userEvent.setup();
    render(<TabBar tabs={[scenario, smalltalk]} />);

    await user.click(screen.getByRole('link', { name: '스몰톡' }));

    expect(track).toHaveBeenCalledWith('Home Tab Switched', {
      tab: 'smalltalk',
    });
  });

  it('지금 보고 있는 탭 칩을 다시 눌러도 전환으로 세지 않는다', async () => {
    mocks.pathname = '/scenario';
    const user = userEvent.setup();
    render(<TabBar tabs={[scenario, smalltalk]} />);

    await user.click(screen.getByRole('link', { name: '시나리오' }));

    expect(track).not.toHaveBeenCalled();
  });
});
