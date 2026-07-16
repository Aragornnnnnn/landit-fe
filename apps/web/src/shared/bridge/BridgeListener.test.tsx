// 전역 뒤로가기 리스너 검증 — 시트 우선 닫기, 홈 이중탭 종료, 무장 해제 분기
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';

import { BridgeListener } from './BridgeListener';

const mocks = vi.hoisted(() => ({
  postToNative: vi.fn(),
  showToast: vi.fn(),
  nativeListener: null as ((message: { type: string }) => void) | null,
  pathname: '/home',
}));

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: mocks.postToNative,
  subscribeFromNative: (listener: (message: { type: string }) => void) => {
    mocks.nativeListener = listener;
    return () => {
      mocks.nativeListener = null;
    };
  },
}));

vi.mock('@/shared/ui/toast', () => ({
  showToast: mocks.showToast,
  TOAST_MS: 2000,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

const pressBack = () =>
  act(() => {
    mocks.nativeListener?.({ type: 'BACK_PRESSED' });
  });

const setNavigation = (canGoBack: boolean) => {
  (window as { navigation?: { canGoBack?: boolean } }).navigation = {
    canGoBack,
  };
};

describe('BridgeListener', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.pathname = '/home';
    mocks.postToNative.mockClear();
    mocks.showToast.mockClear();
    setNavigation(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('홈에서 첫 뒤로가기는 종료 안내만 띄우고 종료하지 않는다', () => {
    render(<BridgeListener />);

    pressBack();

    expect(mocks.showToast).toHaveBeenCalledTimes(1);
    expect(mocks.postToNative).not.toHaveBeenCalled();
  });

  it('안내가 떠 있는 동안 한 번 더 누르면 앱을 종료한다', () => {
    render(<BridgeListener />);

    pressBack();
    pressBack();

    expect(mocks.postToNative).toHaveBeenCalledWith({ type: 'EXIT_APP' });
  });

  it('안내가 사라진 뒤의 뒤로가기는 종료하지 않고 다시 안내한다', () => {
    render(<BridgeListener />);

    pressBack();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    pressBack();

    expect(mocks.showToast).toHaveBeenCalledTimes(2);
    expect(mocks.postToNative).not.toHaveBeenCalled();
  });

  it('홈이 아니고 뒤로 갈 곳이 있으면 히스토리를 되돌린다', () => {
    mocks.pathname = '/me';
    setNavigation(true);
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<BridgeListener />);

    pressBack();

    expect(back).toHaveBeenCalledTimes(1);
    expect(mocks.postToNative).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it('종료 대기 중 다른 화면을 다녀와도 복귀 후 첫 뒤로가기가 앱을 끄지 않는다', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const { rerender } = render(<BridgeListener />);

    pressBack(); // 홈에서 무장
    // 상세 화면으로 이동했다가 뒤로가기로 홈 복귀 (2초 창 안)
    mocks.pathname = '/conversation/1';
    setNavigation(true);
    rerender(<BridgeListener />);
    pressBack(); // history-back — 무장이 풀려야 한다
    mocks.pathname = '/home';
    setNavigation(false);
    rerender(<BridgeListener />);

    pressBack();

    expect(mocks.postToNative).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledTimes(2);
    back.mockRestore();
  });

  it('바텀시트가 열려 있으면 뒤로가기는 시트만 닫고, 무장도 풀린다', () => {
    render(<BridgeListener />);
    pressBack(); // 무장

    const close = vi.fn();
    const unregister = registerOpenSheet(close);
    pressBack(); // 시트 닫기로 소비 — 무장 해제

    expect(close).toHaveBeenCalledTimes(1);
    unregister();

    pressBack();
    expect(mocks.postToNative).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledTimes(2);
  });
});
