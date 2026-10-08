// 한 번 화면에 들어오면 true로 굳는 관찰 훅 — 페이월 섹션 등장 연출의 방아쇠
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInView } from './useInView';

type Callback = (entries: { isIntersecting: boolean }[]) => void;

const observers: {
  callback: Callback;
  options: IntersectionObserverInit;
  disconnect: ReturnType<typeof vi.fn>;
}[] = [];

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn();
      constructor(callback: Callback, options: IntersectionObserverInit) {
        observers.push({ callback, options, disconnect: this.disconnect });
      }
      observe() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

const mount = (rootMargin?: string) => {
  const hook = renderHook(() => useInView<HTMLDivElement>(rootMargin));
  act(() => hook.result.current.ref(document.createElement('div')));
  return hook;
};

describe('useInView', () => {
  it('처음엔 false다', () => {
    const { result } = mount();

    expect(result.current.inView).toBe(false);
  });

  it('화면에 들어오면 true가 되고 관찰을 끊는다', () => {
    const { result } = mount();

    act(() => observers[0].callback([{ isIntersecting: true }]));

    expect(result.current.inView).toBe(true);
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it('들어오지 않은 알림에는 그대로 false다', () => {
    const { result } = mount();

    act(() => observers[0].callback([{ isIntersecting: false }]));

    expect(result.current.inView).toBe(false);
  });

  it('관찰기를 못 쓰는 환경이면 바로 true다 — 연출이 없어도 내용은 보인다', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const { result } = mount();

    expect(result.current.inView).toBe(true);
  });

  it('관찰 범위를 넘기면 그 범위로 관찰한다 — 화면 가운데에 왔을 때 한 번만 도는 연출에 쓴다', () => {
    mount('-45% 0px -45% 0px');

    expect(observers[0].options.rootMargin).toBe('-45% 0px -45% 0px');
  });
});
