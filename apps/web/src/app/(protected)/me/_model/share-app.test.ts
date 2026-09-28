// 친구에게 공유하기 — 셸 공유 시트·웹 공유·링크 복사 중 어느 길로 가는지와 공유 문구 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shareApp } from './share-app';

const shellContext = (bridgeVersion: number) => ({
  platform: 'android',
  appVersion: '1.4.0',
  buildNumber: '20',
  bridgeVersion,
});

const postMessage = vi.fn();
const webShare = vi.fn();
const writeText = vi.fn();

// 셸·브라우저 능력은 전역 값으로만 갈린다 — 테스트마다 필요한 것만 켠다
const setNavigator = (props: { share?: unknown }) => {
  Object.defineProperty(navigator, 'share', {
    value: props.share,
    configurable: true,
  });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
};

beforeEach(() => {
  writeText.mockResolvedValue(undefined);
  setNavigator({});
});

afterEach(() => {
  delete window.__LANDIT_NATIVE__;
  delete window.ReactNativeWebView;
});

describe('shareApp', () => {
  it('공유를 아는 셸이면 셸에 공유 시트를 요청한다', async () => {
    window.__LANDIT_NATIVE__ = shellContext(6);
    window.ReactNativeWebView = { postMessage };

    const method = await shareApp('같이 해요');

    expect(method).toBe('native_sheet');
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      type: 'SHARE',
      message: '같이 해요',
    });
  });

  it('공유를 모르는 구버전 셸이면 셸에 보내지 않고 링크를 복사한다', async () => {
    window.__LANDIT_NATIVE__ = shellContext(5);
    window.ReactNativeWebView = { postMessage };

    const method = await shareApp('같이 해요');

    expect(method).toBe('copy');
    expect(postMessage).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith('같이 해요');
  });

  it('브라우저가 웹 공유를 지원하면 웹 공유 시트를 연다', async () => {
    webShare.mockResolvedValue(undefined);
    setNavigator({ share: webShare });

    const method = await shareApp('같이 해요');

    expect(method).toBe('web_share');
    expect(webShare).toHaveBeenCalledWith({ text: '같이 해요' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('웹 공유 시트를 사용자가 닫으면 복사로 넘어가지 않는다', async () => {
    webShare.mockRejectedValue(new DOMException('닫음', 'AbortError'));
    setNavigator({ share: webShare });

    const method = await shareApp('같이 해요');

    expect(method).toBe('web_share');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('웹 공유가 막히면 링크 복사로 넘어간다', async () => {
    webShare.mockRejectedValue(new DOMException('막힘', 'NotAllowedError'));
    setNavigator({ share: webShare });

    const method = await shareApp('같이 해요');

    expect(method).toBe('copy');
    expect(writeText).toHaveBeenCalledWith('같이 해요');
  });

  it('공유 수단이 없으면 링크를 복사한다', async () => {
    const method = await shareApp('같이 해요');

    expect(method).toBe('copy');
    expect(writeText).toHaveBeenCalledWith('같이 해요');
  });
});
