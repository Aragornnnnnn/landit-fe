// haptic — 진동 이름을 플랫폼별 실제 진동으로 바꿔 WebView면 브릿지로, 밖이면 Vibration API로 보내며 연타는 스로틀한다
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { haptic, muteHaptics } from './haptics';
import { setHapticsEnabled } from './haptics-setting';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(),
}));

const nativeContext = vi.hoisted(() => ({
  platform: null as 'ios' | 'android' | null,
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: () =>
    nativeContext.platform ? { platform: nativeContext.platform } : null,
}));

const postToNativeMock = vi.mocked(postToNative);

afterEach(() => {
  vi.restoreAllMocks();
  nativeContext.platform = null;
});

// 스로틀 상태(모듈 전역 lastFiredAt)가 테스트 간에 남으므로, 시계는 테스트를 가로질러 단조 증가시킨다
let clock = 1_000_000;
const advanceTime = () => {
  vi.spyOn(performance, 'now').mockImplementation(() => (clock += 1000));
};

describe('haptic', () => {
  it('WebView 안이면 이름에 맞는 실제 진동을 담은 HAPTIC 메시지를 네이티브로 보낸다', () => {
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

  it('Android 셸이면 한 칸(tick)을 selection 대신 light로 보낸다', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(true);
    nativeContext.platform = 'android';

    haptic('tick');

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'HAPTIC',
      pattern: 'light',
    });
  });

  it('iOS 셸이면 한 칸(tick)을 selection으로 보낸다', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(true);
    nativeContext.platform = 'ios';

    haptic('tick');

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'HAPTIC',
      pattern: 'selection',
    });
  });

  it('같은 이름 연타는 버린다 (스로틀)', () => {
    postToNativeMock.mockReturnValue(true);
    // 시간을 고정해 두 호출을 같은 순간으로 만든다
    vi.spyOn(performance, 'now').mockReturnValue(5_000_000);

    haptic('tap');
    haptic('tap');

    expect(postToNativeMock).toHaveBeenCalledTimes(1);
  });

  it('스로틀 창 안이라도 다른 이름은 서로 막지 않는다', () => {
    postToNativeMock.mockReturnValue(true);
    // 버튼 누름: 탭(click)의 tap 직후 결과 판정의 error가 같은 순간에 온다
    vi.spyOn(performance, 'now').mockReturnValue(6_000_000);

    haptic('tap');
    haptic('error');

    // 결과 진동(error)이 직전 tap에 눌려 사라지면 안 된다
    expect(postToNativeMock).toHaveBeenCalledTimes(2);
    expect(postToNativeMock).toHaveBeenLastCalledWith({
      type: 'HAPTIC',
      pattern: 'error',
    });
  });
});

describe('haptic 설정', () => {
  it('마이페이지에서 진동을 껐으면 브릿지로도 브라우저로도 아무 것도 보내지 않는다', () => {
    advanceTime();
    setHapticsEnabled(false);
    try {
      haptic('success');
      expect(postToNativeMock).not.toHaveBeenCalled();
    } finally {
      setHapticsEnabled(true);
    }
  });
});

describe('muteHaptics — 녹음하는 동안 진동 막기', () => {
  it('막아 둔 동안에는 어떤 진동도 보내지 않는다 — 진동 소리가 녹음에 섞이지 않게', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(true);
    const unmute = muteHaptics();

    haptic('celebrate');
    haptic('error');

    expect(postToNativeMock).not.toHaveBeenCalled();
    unmute();
  });

  it('풀면 다시 울린다', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(true);
    const unmute = muteHaptics();

    unmute();
    haptic('success');

    expect(postToNativeMock).toHaveBeenCalledTimes(1);
  });

  it('두 곳이 겹쳐 막으면 둘 다 풀려야 울린다', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(true);
    const unmuteA = muteHaptics();
    const unmuteB = muteHaptics();

    unmuteA();
    haptic('success');
    expect(postToNativeMock).not.toHaveBeenCalled();

    unmuteB();
    haptic('success');
    expect(postToNativeMock).toHaveBeenCalledTimes(1);
  });

  it('푸는 함수를 여러 번 불러도 한 번만 풀린다 — 남이 막아 둔 것까지 풀지 않는다', () => {
    advanceTime();
    postToNativeMock.mockReturnValue(true);
    const unmuteA = muteHaptics();
    const unmuteB = muteHaptics();

    unmuteA();
    unmuteA();
    haptic('success');

    expect(postToNativeMock).not.toHaveBeenCalled();
    unmuteB();
  });
});
