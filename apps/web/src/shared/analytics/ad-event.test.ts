// 광고 이벤트를 셸에 넘기는 길 — 알아듣는 셸에만 보내고, 보냈는지를 돌려주는지 검증
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendAdEvent } from './ad-event';

const shellContext = (bridgeVersion: number) => ({
  platform: 'android',
  appVersion: '1.5.0',
  buildNumber: '40',
  bridgeVersion,
});

const postMessage = vi.fn();

afterEach(() => {
  delete window.__LANDIT_NATIVE__;
  delete window.ReactNativeWebView;
});

describe('sendAdEvent', () => {
  it('광고 이벤트를 아는 셸이면 보내고 true를 돌려준다', () => {
    window.__LANDIT_NATIVE__ = shellContext(12);
    window.ReactNativeWebView = { postMessage };

    const sent = sendAdEvent('paywall_viewed');

    expect(sent).toBe(true);
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: 'LOG_AD_EVENT',
      event: 'paywall_viewed',
    });
  });

  it('광고 이벤트를 모르는 옛 셸이면 보내지 않고 false를 돌려준다', () => {
    window.__LANDIT_NATIVE__ = shellContext(11);
    window.ReactNativeWebView = { postMessage };

    const sent = sendAdEvent('paywall_viewed');

    expect(sent).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('셸 밖(브라우저)이면 false를 돌려준다', () => {
    expect(sendAdEvent('paywall_viewed')).toBe(false);
  });
});
