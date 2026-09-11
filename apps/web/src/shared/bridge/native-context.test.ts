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

describe('getNativeContextSnapshot', () => {
  it('주입값이 같으면 같은 객체를 돌려준다 — 렌더 중 스냅샷 비교가 흔들리지 않게', async () => {
    const { getNativeContextSnapshot } = await import('./native-context');
    (window as { __LANDIT_NATIVE__?: unknown }).__LANDIT_NATIVE__ = {
      platform: 'ios',
      appVersion: '1.3.0',
      buildNumber: '6',
      bridgeVersion: 5,
    };

    const first = getNativeContextSnapshot();
    const second = getNativeContextSnapshot();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
  });

  it('주입값이 바뀌면 새로 읽는다', async () => {
    const { getNativeContextSnapshot } = await import('./native-context');
    const win = window as { __LANDIT_NATIVE__?: unknown };
    win.__LANDIT_NATIVE__ = {
      platform: 'ios',
      appVersion: '1.3.0',
      buildNumber: '6',
      bridgeVersion: 5,
    };
    const before = getNativeContextSnapshot();

    win.__LANDIT_NATIVE__ = {
      ...(win.__LANDIT_NATIVE__ as object),
      appVersion: '1.4.0',
    };

    expect(getNativeContextSnapshot()?.appVersion).toBe('1.4.0');
    expect(getNativeContextSnapshot()).not.toBe(before);
  });
});
