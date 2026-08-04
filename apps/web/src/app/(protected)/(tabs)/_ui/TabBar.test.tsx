// TabBar — 고를 게 있을 때만 칩을 그리고, 현재 탭을 활성으로 표시하는지 검증
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TabBar } from './TabBar';
import type { Tab } from './tabs';

const mocks = vi.hoisted(() => ({ pathname: '/scenario' }));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다(vitest.config의 별칭은 소스용).
// 여기서 검증할 건 주소와 활성 표시라 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const scenario: Tab = { href: '/scenario', label: '시나리오', ready: true };
const smalltalk: Tab = { href: '/smalltalk', label: '스몰톡', ready: true };

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
});
