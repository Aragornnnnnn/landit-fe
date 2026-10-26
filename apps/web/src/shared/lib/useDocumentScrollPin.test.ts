// 문서 스크롤 고정 훅 검증 — 입력 중에만 문서를 맨 위로 되돌리는지
// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDocumentScrollPin } from './useDocumentScrollPin';

// 브라우저가 문서를 scrollY만큼 밀어 놓은 상태를 흉내 낸다
const scrollDocumentTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
};

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  vi.restoreAllMocks();
});

describe('useDocumentScrollPin', () => {
  it('입력하는 동안 문서가 밀리면 맨 위로 되돌린다', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderHook(() => useDocumentScrollPin(true));

    scrollDocumentTo(220);

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('입력하지 않을 때는 문서 스크롤을 건드리지 않는다', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderHook(() => useDocumentScrollPin(false));

    scrollDocumentTo(220);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('입력이 끝나면 더는 되돌리지 않는다', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { rerender } = renderHook(
      ({ active }) => useDocumentScrollPin(active),
      {
        initialProps: { active: true },
      },
    );
    rerender({ active: false });

    scrollDocumentTo(220);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
