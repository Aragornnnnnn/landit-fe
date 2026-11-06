// WidgetMenuEntry — 위젯이 실린 셸에서만 보이고 설치 안내로 잇는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WidgetMenuEntry } from './WidgetMenuEntry';

const mocks = vi.hoisted(() => ({ getNativeContext: vi.fn() }));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: mocks.getNativeContext,
}));
// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 주소만 보면 되니 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children }: React.ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(() => cleanup());

describe('WidgetMenuEntry', () => {
  it('위젯이 실린 셸(1.2.0 이상)에서는 설치 안내로 가는 행이 보인다', () => {
    mocks.getNativeContext.mockReturnValue({
      platform: 'ios',
      appVersion: '1.3.0',
      buildNumber: '6',
      bridgeVersion: 5,
    });
    render(<WidgetMenuEntry />);

    expect(screen.getByRole('link', { name: '홈 화면 위젯' })).toHaveAttribute(
      'href',
      '/me/widget',
    );
  });

  it('브라우저나 위젯 없는 구버전 셸에서는 행이 없다', () => {
    mocks.getNativeContext.mockReturnValue(null);
    const { container, unmount } = render(<WidgetMenuEntry />);
    expect(container).toBeEmptyDOMElement();
    unmount();

    mocks.getNativeContext.mockReturnValue({
      platform: 'ios',
      appVersion: '1.1.0',
      buildNumber: '1',
      bridgeVersion: 2,
    });
    expect(render(<WidgetMenuEntry />).container).toBeEmptyDOMElement();
  });
});
