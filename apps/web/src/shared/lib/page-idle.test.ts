// @vitest-environment jsdom
// 첫 화면을 다 받은 뒤 쉬는 틈 — load 전이면 load를 기다리고, 이미 끝났으면 바로 다음 틈에 부르는지 검증
import { afterEach, describe, expect, it, vi } from 'vitest';

import { afterPageLoadIdle } from './page-idle';

const setReadyState = (state: DocumentReadyState) =>
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    get: () => state,
  });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('afterPageLoadIdle', () => {
  it('load 전이면 load가 난 뒤 쉬는 틈에 부른다', () => {
    // Given 아직 문서를 받는 중이고 requestIdleCallback이 있는 브라우저
    setReadyState('loading');
    const idle = vi.fn((callback: () => void) => callback());
    vi.stubGlobal('requestIdleCallback', idle);
    const callback = vi.fn();

    // When 예약하면
    afterPageLoadIdle(callback);

    // Then load 전엔 부르지 않고, load 뒤 쉬는 틈에 한 번 부른다
    expect(callback).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    expect(idle).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('이미 load가 끝났으면 기다리지 않는다', () => {
    setReadyState('complete');
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => callback());
    const callback = vi.fn();

    afterPageLoadIdle(callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('쉬는 틈이 오래 안 와도 2초 안에는 부른다 — 에러 수집이 영영 안 켜지는 일이 없게', () => {
    setReadyState('complete');
    const idle = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle);

    afterPageLoadIdle(vi.fn());

    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 });
  });

  it('load 전에 취소하면 부르지 않는다 — 화면을 떠난 뒤 늦게 실행되지 않게', () => {
    setReadyState('loading');
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => callback());
    const callback = vi.fn();

    const cancel = afterPageLoadIdle(callback);
    cancel();
    window.dispatchEvent(new Event('load'));

    expect(callback).not.toHaveBeenCalled();
  });

  it('requestIdleCallback이 없는 사파리는 다음 틈(setTimeout)에 부른다', () => {
    vi.useFakeTimers();
    setReadyState('complete');
    vi.stubGlobal('requestIdleCallback', undefined);
    const callback = vi.fn();

    afterPageLoadIdle(callback);
    expect(callback).not.toHaveBeenCalled();
    vi.runAllTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
