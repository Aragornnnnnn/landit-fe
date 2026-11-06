// 앱 안에서 클라이언트 이동으로 랜딩에 와도 홈으로 돌아가는지 검증
// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShellRedirect } from './ShellRedirect';

afterEach(() => {
  cleanup();
  delete window.ReactNativeWebView;
  document.documentElement.style.visibility = '';
  vi.restoreAllMocks();
});

const spyReplace = () => {
  const replace = vi.fn();
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    replace,
  });
  return replace;
};

describe('ShellRedirect', () => {
  it('셸 안에서 그려지면 인라인 스크립트 없이도 홈으로 보낸다', () => {
    // Given
    window.ReactNativeWebView = { postMessage: () => {} };
    const replace = spyReplace();

    // When
    render(<ShellRedirect />);

    // Then
    expect(replace).toHaveBeenCalledWith('/scenario');
  });

  it('일반 브라우저에서는 이동하지 않는다', () => {
    const replace = spyReplace();

    render(<ShellRedirect />);

    expect(replace).not.toHaveBeenCalled();
  });
});
