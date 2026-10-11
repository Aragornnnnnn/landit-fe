// 전역 뒤로가기 리스너 검증 — 시트 우선 닫기, 홈 이중탭 종료, 무장 해제 분기
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';

import { BridgeListener } from './BridgeListener';

const mocks = vi.hoisted(() => ({
  postToNative: vi.fn(),
  showToast: vi.fn(),
  routerPush: vi.fn(),
  nativeListener: null as
    ((message: { type: string; url?: string; path?: string }) => void) | null,
  pathname: '/scenario',
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
  useRouter: () => ({ push: mocks.routerPush }),
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
    mocks.pathname = '/scenario';
    mocks.postToNative.mockClear();
    mocks.showToast.mockClear();
    mocks.routerPush.mockClear();
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
    mocks.pathname = '/conversation/scenario/1';
    setNavigation(true);
    rerender(<BridgeListener />);
    pressBack(); // history-back — 무장이 풀려야 한다
    mocks.pathname = '/scenario';
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

  it('NAVIGATE 메시지를 받으면 그 경로로 이동한다', () => {
    render(<BridgeListener />);

    act(() => {
      mocks.nativeListener?.({ type: 'NAVIGATE', url: '/expressions' });
    });

    expect(mocks.routerPush).toHaveBeenCalledWith('/expressions');
  });

  it('온보딩 중에 받은 NAVIGATE는 무시한다 — 위젯 탭으로 돌아와도 온보딩이 밀려나지 않는다', () => {
    mocks.pathname = '/onboarding';
    render(<BridgeListener />);

    act(() => {
      mocks.nativeListener?.({
        type: 'NAVIGATE',
        url: '/scenario?utm_source=widget&utm_medium=widget&utm_campaign=streak_widget',
      });
    });

    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it('온보딩을 마치고 다른 화면으로 옮긴 뒤의 NAVIGATE는 다시 이동한다', () => {
    mocks.pathname = '/onboarding';
    const { rerender } = render(<BridgeListener />);
    mocks.pathname = '/scenario';
    rerender(<BridgeListener />);

    act(() => {
      mocks.nativeListener?.({ type: 'NAVIGATE', url: '/expressions' });
    });

    expect(mocks.routerPush).toHaveBeenCalledWith('/expressions');
  });

  describe('알람 "대화하러 가기" (ALARM_OPENED)', () => {
    const openAlarm = () =>
      act(() => {
        mocks.nativeListener?.({
          type: 'ALARM_OPENED',
          alarmType: 'scenario',
          path: '/scenario',
        } as never);
      });

    it('학습 중이 아니면 알람이 정한 화면으로 이동한다', () => {
      mocks.pathname = '/me';
      render(<BridgeListener />);

      openAlarm();

      expect(mocks.routerPush).toHaveBeenCalledWith('/scenario');
    });

    it.each([
      ['시나리오 대화', '/conversation/scenario/3'],
      ['스몰톡 대화', '/conversation/smalltalk'],
      ['표현학습', '/expressions/scenario/3/branch'],
      ['복습 퀴즈', '/reviews/12'],
      ['설문', '/survey'],
      ['온보딩', '/onboarding'],
    ])('%s 중이면 이동하지 않는다 — 하던 걸 잃지 않게', (_, pathname) => {
      mocks.pathname = pathname;
      render(<BridgeListener />);

      openAlarm();

      expect(mocks.routerPush).not.toHaveBeenCalled();
    });
  });

  it('NAVIGATE는 뒤로가기 처리에 영향을 주지 않는다', () => {
    render(<BridgeListener />);

    act(() => {
      mocks.nativeListener?.({ type: 'NAVIGATE', url: '/expressions' });
    });

    expect(mocks.postToNative).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });
});
