// AppVersionFooter — 셸 안에서는 앱 버전과 빌드 번호를 보여 주고, 브라우저에서는 아무것도 그리지 않는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppVersionFooter } from './AppVersionFooter';

const mocks = vi.hoisted(() => ({ getNativeContext: vi.fn() }));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: mocks.getNativeContext,
}));

afterEach(() => cleanup());

describe('AppVersionFooter', () => {
  it('셸 안에서는 앱 버전과 빌드 번호를 함께 보여 준다', () => {
    mocks.getNativeContext.mockReturnValue({
      platform: 'ios',
      appVersion: '1.5.0',
      buildNumber: '20',
      bridgeVersion: 9,
    });

    render(<AppVersionFooter />);

    expect(screen.getByText('앱 버전 1.5.0 (20)')).toBeInTheDocument();
  });

  it('빌드 번호가 없으면 앱 버전만 보여 준다', () => {
    mocks.getNativeContext.mockReturnValue({
      platform: 'android',
      appVersion: '1.5.0',
      buildNumber: null,
      bridgeVersion: 9,
    });

    render(<AppVersionFooter />);

    expect(screen.getByText('앱 버전 1.5.0')).toBeInTheDocument();
  });

  it('브라우저에서는 아무것도 그리지 않는다', () => {
    mocks.getNativeContext.mockReturnValue(null);

    const { container } = render(<AppVersionFooter />);

    expect(container).toBeEmptyDOMElement();
  });
});
