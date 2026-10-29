// 화면 언어를 셸에 알리는지 — 셸 문구(알람 버튼·위젯·오류 화면)가 웹 화면과 같은 언어가 되게 한다
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { NativeLocaleSync } from './NativeLocaleSync';

vi.mock('@/shared/bridge/web-bridge', () => ({ postToNative: vi.fn() }));
const postMock = vi.mocked(postToNative);

const screenLocale = vi.hoisted(() => ({ value: 'ja' }));
vi.mock('next-intl', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next-intl')>()),
  useLocale: () => screenLocale.value,
}));

const shell = (bridgeVersion: number) => ({
  platform: 'ios',
  appVersion: '1.6.0',
  buildNumber: '30',
  bridgeVersion,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  delete window.__LANDIT_NATIVE__;
  screenLocale.value = 'ja';
});

describe('NativeLocaleSync', () => {
  it('셸 안이면 지금 화면 언어를 알린다', () => {
    window.__LANDIT_NATIVE__ = shell(14);

    render(<NativeLocaleSync />);

    expect(postMock).toHaveBeenCalledWith({ type: 'SET_LOCALE', locale: 'ja' });
  });

  it('화면 언어가 바뀌면 다시 알린다', () => {
    window.__LANDIT_NATIVE__ = shell(14);
    const { rerender } = render(<NativeLocaleSync />);

    screenLocale.value = 'ko';
    rerender(<NativeLocaleSync />);

    expect(postMock).toHaveBeenLastCalledWith({
      type: 'SET_LOCALE',
      locale: 'ko',
    });
    expect(postMock).toHaveBeenCalledTimes(2);
  });

  it('메시지를 모르는 구 셸(브릿지 13 이하)과 브라우저에는 보내지 않는다', () => {
    window.__LANDIT_NATIVE__ = shell(13);
    render(<NativeLocaleSync />);
    cleanup();
    delete window.__LANDIT_NATIVE__;
    render(<NativeLocaleSync />);

    expect(postMock).not.toHaveBeenCalled();
  });
});
