// 첫 시나리오 완료 광고 이벤트 — 계정마다 한 번만, 이미 끝내 본 사람은 빼고, 못 보냈으면 다음에 다시 보내는지 검증
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { reportFirstScenarioCompleted } from './first-completion-ad-event';

const postMessage = vi.fn();
// 테스트마다 다른 사람이다 — 이번 실행 안의 기억이 다음 테스트로 새지 않게
let USER = 0;
beforeEach(() => {
  USER += 1;
});

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

afterEach(() => {
  localStorage.clear();
  delete window.__LANDIT_NATIVE__;
  delete window.ReactNativeWebView;
});

describe('reportFirstScenarioCompleted', () => {
  it('처음 끝낸 사람이면 첫 시나리오 완료를 셸에 보낸다', () => {
    openShell(12);

    reportFirstScenarioCompleted(USER, false);

    expect(sentEvents()).toEqual([
      { type: 'LOG_AD_EVENT', event: 'first_scenario_completed' },
    ]);
  });

  it('한 번 보낸 뒤 다시 끝내면 보내지 않는다', () => {
    openShell(12);
    reportFirstScenarioCompleted(USER, false);

    reportFirstScenarioCompleted(USER, false);

    expect(sentEvents()).toHaveLength(1);
  });

  it('서버가 이미 끝내 본 사람이라고 하면 보내지 않는다', () => {
    openShell(12);

    reportFirstScenarioCompleted(USER, true);

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('옛 셸이라 못 보냈으면 보낸 것으로 치지 않아, 앱을 올린 뒤 처음 끝낼 때 보낸다', () => {
    openShell(11);
    reportFirstScenarioCompleted(USER, false);
    openShell(12);

    reportFirstScenarioCompleted(USER, false);

    expect(sentEvents()).toEqual([
      { type: 'LOG_AD_EVENT', event: 'first_scenario_completed' },
    ]);
  });

  it('같은 기기에서 다른 계정이 처음 끝내면 그 계정 몫으로 또 보낸다', () => {
    openShell(12);
    reportFirstScenarioCompleted(USER, false);

    reportFirstScenarioCompleted(USER + 1000, false);

    expect(sentEvents()).toHaveLength(2);
  });

  it('기기에 남기지 못해도 이번 실행 안에서는 두 번 보내지 않는다', () => {
    openShell(12);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('저장소 꽉 참');
    });
    reportFirstScenarioCompleted(USER, false);

    reportFirstScenarioCompleted(USER, false);

    expect(sentEvents()).toHaveLength(1);
  });
});
