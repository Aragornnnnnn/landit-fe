// 키보드가 가린 높이 계산 — 뷰포트가 줄면 그만큼, iOS가 innerHeight를 잠깐 줄였다 소리 없이 되돌리면 잠시 뒤 다시 잰다
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useKeyboardInset } from './useKeyboardInset';

// visualViewport 대역 — 높이·오프셋을 바꾸고 이벤트를 쏠 수 있다
const viewport = Object.assign(new EventTarget(), {
  height: 874,
  offsetTop: 0,
});

const setLayout = (innerHeight: number) =>
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: innerHeight,
  });

const viewportResize = () => viewport.dispatchEvent(new Event('resize'));

beforeEach(() => {
  vi.useFakeTimers();
  viewport.height = 874;
  viewport.offsetTop = 0;
  setLayout(874);
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useKeyboardInset', () => {
  it('키보드가 뷰포트를 가리면 가린 높이를 돌려준다', () => {
    const { result } = renderHook(() => useKeyboardInset());

    act(() => {
      viewport.height = 806;
      viewportResize();
    });

    expect(result.current).toBe(68);
  });

  it('이벤트 순간 innerHeight도 같이 줄었다가 알림 없이 돌아오면 잠시 뒤 다시 재서 잡는다', () => {
    const { result } = renderHook(() => useKeyboardInset());

    // iOS 웹뷰: resize 순간엔 innerHeight까지 806, 문서는 68만큼 밀려 있다
    act(() => {
      setLayout(806);
      viewport.height = 806;
      viewport.offsetTop = 68;
      viewportResize();
    });
    expect(result.current).toBe(0);

    // 그 뒤 innerHeight가 이벤트 없이 874로 돌아오고 문서는 제자리로
    act(() => {
      setLayout(874);
      viewport.offsetTop = 0;
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(68);
  });

  it('키보드가 내려가면 0으로 돌아온다', () => {
    const { result } = renderHook(() => useKeyboardInset());
    act(() => {
      viewport.height = 806;
      viewportResize();
    });

    act(() => {
      viewport.height = 874;
      viewportResize();
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(0);
  });
});
