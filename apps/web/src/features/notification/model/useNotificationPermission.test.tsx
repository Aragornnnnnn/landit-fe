// useNotificationPermission — 환경 판별과 브릿지 왕복으로 상태가 갱신되는 갈림길 검증
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

import { useNotificationPermission } from './useNotificationPermission';

vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: vi.fn(() => null),
}));
const getNativeContextMock = vi.mocked(getNativeContext);

const mocks = vi.hoisted(() => ({
  listeners: [] as Array<(message: unknown) => void>,
}));

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
  subscribeFromNative: vi.fn((listener: (message: unknown) => void) => {
    mocks.listeners.push(listener);
    return () => {
      mocks.listeners = mocks.listeners.filter((l) => l !== listener);
    };
  }),
}));
const postToNativeMock = vi.mocked(postToNative);

const Probe = () => <p>{useNotificationPermission()}</p>;

const nativeContext = (bridgeVersion: number) => ({
  platform: 'ios' as const,
  appVersion: '1.1.0',
  buildNumber: '43',
  bridgeVersion,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.listeners = [];
});

describe('useNotificationPermission', () => {
  it('일반 브라우저(컨텍스트 없음)에선 unavailable로 남고 조회도 보내지 않는다', () => {
    getNativeContextMock.mockReturnValue(null);

    render(<Probe />);

    expect(screen.getByText('unavailable')).toBeInTheDocument();
    expect(postToNativeMock).not.toHaveBeenCalled();
  });

  it('구버전 셸(bridgeVersion 1)에선 unavailable로 남고 조회도 보내지 않는다', () => {
    getNativeContextMock.mockReturnValue(nativeContext(1));

    render(<Probe />);

    expect(screen.getByText('unavailable')).toBeInTheDocument();
    expect(postToNativeMock).not.toHaveBeenCalled();
  });

  it('신버전 셸이면 조회를 보내고, 회신이 오면 그 상태가 된다', () => {
    getNativeContextMock.mockReturnValue(nativeContext(2));

    render(<Probe />);

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'GET_NOTIFICATION_PERMISSION',
    });

    act(() => {
      mocks.listeners.forEach((listener) =>
        listener({ type: 'NOTIFICATION_PERMISSION', status: 'undetermined' }),
      );
    });

    expect(screen.getByText('undetermined')).toBeInTheDocument();
  });

  it('이후 회신(권한 요청 결과)이 또 오면 상태가 따라 바뀐다', () => {
    getNativeContextMock.mockReturnValue(nativeContext(2));

    render(<Probe />);
    act(() => {
      mocks.listeners.forEach((listener) =>
        listener({ type: 'NOTIFICATION_PERMISSION', status: 'undetermined' }),
      );
    });
    act(() => {
      mocks.listeners.forEach((listener) =>
        listener({ type: 'NOTIFICATION_PERMISSION', status: 'granted' }),
      );
    });

    expect(screen.getByText('granted')).toBeInTheDocument();
  });

  it('포그라운드 복귀(visibilitychange)마다 다시 조회한다 — OS 설정에서 바꾸고 돌아온 경우', () => {
    getNativeContextMock.mockReturnValue(nativeContext(2));

    render(<Probe />);
    expect(postToNativeMock).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(postToNativeMock).toHaveBeenCalledTimes(2);
    expect(postToNativeMock).toHaveBeenLastCalledWith({
      type: 'GET_NOTIFICATION_PERMISSION',
    });
  });

  it('알림과 무관한 메시지는 무시한다', () => {
    getNativeContextMock.mockReturnValue(nativeContext(2));

    render(<Probe />);
    act(() => {
      mocks.listeners.forEach((listener) => listener({ type: 'BACK_PRESSED' }));
    });

    expect(screen.getByText('unavailable')).toBeInTheDocument();
  });
});
