// 네이티브 컨텍스트 리더 — 셸 안이면 주입값을 읽고, 브라우저면 null/browser로 떨어진다
import { afterEach, describe, expect, it } from 'vitest';

import { getNativeContext, getSurface } from './native-context';

const injected = {
  platform: 'ios',
  appVersion: '1.0.0',
  buildNumber: '42',
  bridgeVersion: 1,
} as const;

afterEach(() => {
  delete window.__LANDIT_NATIVE__;
});

describe('getNativeContext', () => {
  it('셸이 주입한 값을 읽는다', () => {
    window.__LANDIT_NATIVE__ = injected;

    expect(getNativeContext()).toEqual(injected);
  });

  it('주입값이 없으면(브라우저) null', () => {
    expect(getNativeContext()).toBeNull();
  });

  it('주입값이 규격 밖이면 null', () => {
    window.__LANDIT_NATIVE__ = { platform: 'web' };

    expect(getNativeContext()).toBeNull();
  });
});

describe('getSurface', () => {
  it('셸 안이면 app', () => {
    window.__LANDIT_NATIVE__ = injected;

    expect(getSurface()).toBe('app');
  });

  it('브라우저면 browser', () => {
    expect(getSurface()).toBe('browser');
  });
});
