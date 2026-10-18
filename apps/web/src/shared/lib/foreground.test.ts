// listenForeground — 화면이 다시 보일 때만 부르고, 정리하면 더 부르지 않는다
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listenForeground } from './foreground';

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

afterEach(() => setVisibility('visible'));

describe('listenForeground', () => {
  it('화면이 다시 보이면 부른다', () => {
    const onForeground = vi.fn();
    listenForeground(onForeground);

    setVisibility('visible');

    expect(onForeground).toHaveBeenCalledTimes(1);
  });

  it('화면이 가려질 때는 부르지 않는다', () => {
    const onForeground = vi.fn();
    listenForeground(onForeground);

    setVisibility('hidden');

    expect(onForeground).not.toHaveBeenCalled();
  });

  it('정리한 뒤에는 다시 보여도 부르지 않는다', () => {
    const onForeground = vi.fn();
    const stop = listenForeground(onForeground);

    stop();
    setVisibility('visible');

    expect(onForeground).not.toHaveBeenCalled();
  });
});
