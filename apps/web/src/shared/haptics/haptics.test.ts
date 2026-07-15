// haptic — WebView면 브릿지로 보내고, 밖이면 Vibration API로 폴백하며, 연타는 스로틀한다
import { afterEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { haptic } from './haptics';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(),
}));

const postToNativeMock = vi.mocked(postToNative);

afterEach(() => {
  vi.restoreAllMocks();
});

// 스로틀 상태(모듈 전역 lastFiredAt)가 테스트 간에 남으므로, 시계는 테스트를 가로질러 단조 증가시킨다
let clock = 1_000_000;
const advanceTime = () => {
  vi.spyOn(performance, 'now').mockImplementation(() => (clock += 1000));
};

describe('haptic', () => {
  it('WebView 안이면 패턴을 담은 HAPTIC 메시지를 네이티브로 보낸다', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(true);

    haptic('success');

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'HAPTIC',
      pattern: 'success',
    });
  });

  it('WebView 밖이면 Vibration API로 폴백한다', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(false);
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });

    haptic('error');

    expect(vibrate).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('같은 패턴 연타는 버린다 (스로틀)', () => {
    postToNativeMock.mockReturnValue(true);
    // 시간을 고정해 두 호출을 같은 순간으로 만든다
    vi.spyOn(performance, 'now').mockReturnValue(5_000_000);

    haptic('light');
    haptic('light');

    expect(postToNativeMock).toHaveBeenCalledTimes(1);
  });

  it('스로틀 창 안이라도 다른 패턴은 서로 막지 않는다', () => {
    postToNativeMock.mockReturnValue(true);
    // 버튼 누름: pointerdown의 selection 틱 직후 결과 판정의 error가 같은 순간에 온다
    vi.spyOn(performance, 'now').mockReturnValue(6_000_000);

    haptic('selection');
    haptic('error');

    // 결과 진동(error)이 직전 selection 틱에 눌려 사라지면 안 된다
    expect(postToNativeMock).toHaveBeenCalledTimes(2);
    expect(postToNativeMock).toHaveBeenLastCalledWith({
      type: 'HAPTIC',
      pattern: 'error',
    });
  });
});
