// WidgetGuideScreen — 마이페이지 출처를 계측에 싣고, 나중에·핀·홈으로가기 모두 마이페이지로 돌아온다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WidgetGuideScreen } from './WidgetGuideScreen';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  postToNative: vi.fn(() => true),
  getNativeContext: vi.fn(),
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, back: mocks.back }),
}));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: mocks.postToNative,
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: mocks.getNativeContext,
  getNativeContextSnapshot: mocks.getNativeContext,
}));
vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('next/image', () => ({ default: () => <span /> }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getNativeContext.mockReturnValue({
    platform: 'android',
    appVersion: '1.3.0',
    buildNumber: '6',
    bridgeVersion: 5,
  });
});
afterEach(() => cleanup());

describe('WidgetGuideScreen', () => {
  it('설치 유도 노출을 마이페이지 출처로 남긴다', () => {
    render(<WidgetGuideScreen />);
    expect(mocks.track).toHaveBeenCalledWith('Widget Install Invite Viewed', {
      source: 'me',
    });
  });

  it('안드로이드에서 추가하기를 누르면 셸에 핀을 청하고 마이페이지로 돌아간다', () => {
    render(<WidgetGuideScreen />);
    fireEvent.click(screen.getByRole('button', { name: /추가/ }));

    expect(mocks.postToNative).toHaveBeenCalledWith({
      type: 'REQUEST_WIDGET_PIN',
    });
    expect(mocks.replace).toHaveBeenCalledWith('/me');
  });
});
