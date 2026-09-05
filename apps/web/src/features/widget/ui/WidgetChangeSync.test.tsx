// WidgetChangeSync — 새 셸에서만 쌓인 변경을 청하고, 넘어온 추가·삭제를 이벤트로 남기는 계약
import { EVENTS } from '@landit/analytics';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { getNativeContext } from '@/shared/bridge/native-context';

import { WidgetChangeSync } from './WidgetChangeSync';

const mocks = vi.hoisted(() => ({
  postToNative: vi.fn(() => true),
  nativeListener: null as ((message: unknown) => void) | null,
}));

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/bridge/native-context');
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: mocks.postToNative,
  subscribeFromNative: (listener: (message: unknown) => void) => {
    mocks.nativeListener = listener;
    return () => {
      mocks.nativeListener = null;
    };
  },
}));

const shell = (bridgeVersion: number) => ({
  platform: 'android' as const,
  appVersion: '1.2.0',
  buildNumber: '18',
  bridgeVersion,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.nativeListener = null;
});

afterEach(() => cleanup());

describe('WidgetChangeSync', () => {
  it('새 셸이면 마운트 때 쌓인 변경을 청한다', () => {
    vi.mocked(getNativeContext).mockReturnValue(shell(4));

    render(<WidgetChangeSync />);

    expect(mocks.postToNative).toHaveBeenCalledWith({
      type: 'REQUEST_WIDGET_CHANGES',
    });
  });

  it('넘어온 추가·삭제를 크기와 함께 이벤트로 남긴다', () => {
    vi.mocked(getNativeContext).mockReturnValue(shell(4));
    render(<WidgetChangeSync />);

    act(() => {
      mocks.nativeListener?.({
        type: 'WIDGET_CHANGED',
        change: 'added',
        family: 'small',
      });
      mocks.nativeListener?.({
        type: 'WIDGET_CHANGED',
        change: 'removed',
        family: 'large',
      });
    });

    expect(track).toHaveBeenCalledWith(EVENTS.WIDGET_INSTALLED, {
      family: 'small',
    });
    expect(track).toHaveBeenCalledWith(EVENTS.WIDGET_REMOVED, {
      family: 'large',
    });
  });

  it('구버전 셸이나 브라우저에선 청하지도 듣지도 않는다', () => {
    vi.mocked(getNativeContext).mockReturnValue(shell(3));
    render(<WidgetChangeSync />);
    expect(mocks.postToNative).not.toHaveBeenCalled();
    expect(mocks.nativeListener).toBeNull();
    cleanup();

    vi.mocked(getNativeContext).mockReturnValue(null);
    render(<WidgetChangeSync />);
    expect(mocks.postToNative).not.toHaveBeenCalled();
    expect(mocks.nativeListener).toBeNull();
  });
});
