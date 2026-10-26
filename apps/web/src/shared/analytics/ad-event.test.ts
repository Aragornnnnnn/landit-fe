// 광고 이벤트를 셸에 넘기는 길 — 알아듣는 셸에만 보내고, 한 번만 보낼 이벤트는 계정마다 한 번만 가는지 검증
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendAdEvent, sendAdEventOnce } from './ad-event';

const postMessage = vi.fn();

const openShell = (bridgeVersion: number) => {
  window.__LANDIT_NATIVE__ = {
    platform: 'android',
    appVersion: '1.5.0',
    buildNumber: '40',
    bridgeVersion,
  };
  window.ReactNativeWebView = { postMessage };
};

const sentEvents = () =>
  postMessage.mock.calls.map(([raw]) => JSON.parse(raw as string));

// 테스트마다 다른 사람이다 — 이번 실행 안의 기억이 다음 테스트로 새지 않게
let user = 0;
beforeEach(() => {
  user += 1;
});

afterEach(() => {
  localStorage.clear();
  delete window.__LANDIT_NATIVE__;
  delete window.ReactNativeWebView;
});

describe('sendAdEvent', () => {
  it('광고 이벤트를 아는 셸이면 보내고 true를 돌려준다', () => {
    openShell(12);

    const sent = sendAdEvent('paywall_viewed');

    expect(sent).toBe(true);
    expect(sentEvents()).toEqual([
      { type: 'LOG_AD_EVENT', event: 'paywall_viewed' },
    ]);
  });

  it('광고 이벤트를 모르는 옛 셸이면 보내지 않고 false를 돌려준다', () => {
    openShell(11);

    const sent = sendAdEvent('paywall_viewed');

    expect(sent).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('셸 밖(브라우저)이면 false를 돌려준다', () => {
    expect(sendAdEvent('paywall_viewed')).toBe(false);
  });
});

describe('sendAdEventOnce', () => {
  it('처음이면 보낸다', () => {
    openShell(12);

    sendAdEventOnce('first_expression_completed', user);

    expect(sentEvents()).toEqual([
      { type: 'LOG_AD_EVENT', event: 'first_expression_completed' },
    ]);
  });

  it('같은 계정이 다시 하면 보내지 않는다', () => {
    openShell(12);
    sendAdEventOnce('first_expression_completed', user);

    sendAdEventOnce('first_expression_completed', user);

    expect(sentEvents()).toHaveLength(1);
  });

  it('이벤트가 다르면 따로 센다', () => {
    openShell(12);
    sendAdEventOnce('onboarding_completed', user);

    sendAdEventOnce('first_expression_completed', user);

    expect(sentEvents()).toHaveLength(2);
  });

  it('같은 기기에서 다른 계정이 처음 하면 그 계정 몫으로 또 보낸다', () => {
    openShell(12);
    sendAdEventOnce('first_expression_completed', user);

    sendAdEventOnce('first_expression_completed', user + 1000);

    expect(sentEvents()).toHaveLength(2);
  });

  it('옛 셸이라 못 보냈으면 보낸 것으로 치지 않아, 앱을 올린 뒤 처음 할 때 보낸다', () => {
    openShell(11);
    sendAdEventOnce('first_expression_completed', user);
    openShell(12);

    sendAdEventOnce('first_expression_completed', user);

    expect(sentEvents()).toEqual([
      { type: 'LOG_AD_EVENT', event: 'first_expression_completed' },
    ]);
  });

  it('기기에 남기지 못해도 이번 실행 안에서는 두 번 보내지 않는다', () => {
    openShell(12);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('저장소 꽉 참');
    });
    sendAdEventOnce('first_expression_completed', user);

    sendAdEventOnce('first_expression_completed', user);

    expect(sentEvents()).toHaveLength(1);
  });
});
