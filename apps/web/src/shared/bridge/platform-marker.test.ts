// 첫 페인트 전 <html data-platform> 표시 — Android 셸에서만 찍고, 브라우저에서는 찍지 않는다
import { afterEach, describe, expect, it } from 'vitest';

import { markNativePlatform, platformMarkerScript } from './platform-marker';

afterEach(() => {
  delete window.__LANDIT_NATIVE__;
  delete document.documentElement.dataset.platform;
});

describe('markNativePlatform', () => {
  it('셸이 android를 주면 html에 android를 표시한다', () => {
    window.__LANDIT_NATIVE__ = { platform: 'android' };

    markNativePlatform();

    expect(document.documentElement.dataset.platform).toBe('android');
  });

  it('브라우저처럼 주입값이 없으면 표시하지 않는다', () => {
    markNativePlatform();

    expect(document.documentElement.dataset.platform).toBeUndefined();
  });
});

describe('platformMarkerScript', () => {
  // 인라인 스크립트는 모듈 밖에서 문자열로 실행된다 — 바깥 변수를 참조하면 거기서 터진다
  it('문자열만으로 실행돼 같은 표시를 남긴다', () => {
    window.__LANDIT_NATIVE__ = { platform: 'android' };

    new Function(platformMarkerScript)();

    expect(document.documentElement.dataset.platform).toBe('android');
  });
});
