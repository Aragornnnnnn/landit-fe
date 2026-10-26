// TrackingStatusSync — 새 iOS 셸에서만 ATT 상태를 묻고, 상태는 매번 속성으로·처음 답한 것만 이벤트로 남기는 계약
import { EVENTS } from '@landit/analytics';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getNativeContext } from '@/shared/bridge/native-context';

import { setUserProperties, track } from './amplitude';
import { TrackingStatusSync } from './TrackingStatusSync';

const mocks = vi.hoisted(() => ({
  postToNative: vi.fn(() => true),
  nativeListener: null as ((message: unknown) => void) | null,
}));

vi.mock('./amplitude', () => ({ track: vi.fn(), setUserProperties: vi.fn() }));
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

const shell = (platform: 'ios' | 'android', bridgeVersion: number) => ({
  platform,
  appVersion: '1.5.0',
  buildNumber: '23',
  bridgeVersion,
});

const answer = (status: string, prompted: boolean) =>
  act(() => {
    mocks.nativeListener?.({ type: 'TRACKING_STATUS', status, prompted });
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.nativeListener = null;
});

afterEach(() => cleanup());

describe('TrackingStatusSync', () => {
  it('새 iOS 셸이면 마운트 때 추적 허용 상태를 묻는다', () => {
    vi.mocked(getNativeContext).mockReturnValue(shell('ios', 13));

    render(<TrackingStatusSync />);

    expect(mocks.postToNative).toHaveBeenCalledWith({
      type: 'REQUEST_TRACKING_STATUS',
    });
  });

  it('이번에 권한창에 답했으면 상태를 속성으로 올리고 결정 이벤트를 남긴다', () => {
    vi.mocked(getNativeContext).mockReturnValue(shell('ios', 13));
    render(<TrackingStatusSync />);

    answer('denied', true);

    expect(setUserProperties).toHaveBeenCalledWith({ att_status: 'denied' });
    expect(track).toHaveBeenCalledWith(EVENTS.TRACKING_PERMISSION_DECIDED, {
      granted: false,
    });
  });

  it('예전에 답해 둔 상태면 속성만 올리고 이벤트는 남기지 않는다', () => {
    vi.mocked(getNativeContext).mockReturnValue(shell('ios', 13));
    render(<TrackingStatusSync />);

    answer('granted', false);

    expect(setUserProperties).toHaveBeenCalledWith({ att_status: 'granted' });
    expect(track).not.toHaveBeenCalled();
  });

  it('Android·구버전 셸·브라우저에선 묻지도 듣지도 않는다', () => {
    for (const context of [shell('android', 13), shell('ios', 12), null]) {
      vi.mocked(getNativeContext).mockReturnValue(context);

      render(<TrackingStatusSync />);

      expect(mocks.postToNative).not.toHaveBeenCalled();
      expect(mocks.nativeListener).toBeNull();
      cleanup();
    }
  });
});
