// 셸 안에서 연 첫 화면은 랜딩 대신 홈으로 — 셸 판별과 인라인 스크립트 실행 검증
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { redirectShellToHome, shellRedirectScript } from './shell-redirect';

afterEach(() => {
  delete window.ReactNativeWebView;
  delete window.__LANDIT_NATIVE__;
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

describe('redirectShellToHome', () => {
  it('셸 웹뷰 안이면 홈으로 교체 이동한다', () => {
    // Given
    window.ReactNativeWebView = { postMessage: () => {} };
    const replace = spyReplace();

    // When
    redirectShellToHome('/scenario');

    // Then
    expect(replace).toHaveBeenCalledWith('/scenario');
  });

  it('셸 안이면 이동 전까지 랜딩이 비치지 않게 화면을 숨긴다', () => {
    window.ReactNativeWebView = { postMessage: () => {} };
    spyReplace();

    redirectShellToHome('/scenario');

    expect(document.documentElement.style.visibility).toBe('hidden');
  });

  it('일반 브라우저면 랜딩에 머문다', () => {
    const replace = spyReplace();

    redirectShellToHome('/scenario');

    expect(replace).not.toHaveBeenCalled();
    expect(document.documentElement.style.visibility).toBe('');
  });
});

describe('shellRedirectScript', () => {
  // 인라인 스크립트는 모듈 밖에서 문자열로 실행된다 — 바깥 변수를 참조하면 거기서 터진다
  it('문자열만으로 실행돼 홈 주소로 보낸다', () => {
    window.ReactNativeWebView = { postMessage: () => {} };
    const replace = spyReplace();

    new Function(shellRedirectScript)();

    expect(replace).toHaveBeenCalledWith('/scenario');
  });
});
