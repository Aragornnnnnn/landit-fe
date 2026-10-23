// 글자 크기 설정 — 처음 한 번 기기 배율로 단계를 정해 저장하고, 그 뒤로는 고른 값을 유지한다. 구 셸에서는 끈다
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyInitialFontScale,
  fontScaleScript,
  getFontScale,
  isFontScaleAvailable,
  setFontScale,
  subscribeFontScale,
  type FontScale,
} from './font-scale';

const appliedScale = () =>
  document.documentElement.style.getPropertyValue('--font-scale');

const shell = (context: Record<string, unknown>) => {
  window.__LANDIT_NATIVE__ = {
    platform: 'ios',
    appVersion: '1.6.0',
    buildNumber: '1',
    bridgeVersion: 10,
    ...context,
  };
};

afterEach(() => {
  localStorage.clear();
  delete window.__LANDIT_NATIVE__;
  document.documentElement.style.removeProperty('--font-scale');
});

describe('applyInitialFontScale', () => {
  it('저장값이 없으면 기기 배율에 가장 가까운 단계를 정해 저장하고 적용한다', () => {
    shell({ fontScale: 1.12 });

    applyInitialFontScale();

    expect(localStorage.getItem('landit-font-scale')).toBe('1.15');
    expect(appliedScale()).toBe('1.15');
  });

  it('기기 배율이 가장 크게보다 크면 가장 크게로 정한다', () => {
    shell({ fontScale: 2 });

    applyInitialFontScale();

    expect(appliedScale()).toBe('1.3');
  });

  it('기기 배율이 가장 작게보다 작으면 가장 작게로 정한다', () => {
    shell({ fontScale: 0.7 });

    applyInitialFontScale();

    expect(appliedScale()).toBe('0.85');
  });

  it('저장값이 있으면 기기 배율이 달라도 저장값을 적용한다', () => {
    localStorage.setItem('landit-font-scale', '0.92');
    shell({ fontScale: 1.3 });

    applyInitialFontScale();

    expect(appliedScale()).toBe('0.92');
    expect(localStorage.getItem('landit-font-scale')).toBe('0.92');
  });

  it('목록에 없는 값이 저장돼 있으면 기기 배율로 다시 정한다', () => {
    localStorage.setItem('landit-font-scale', '3');
    shell({ fontScale: 1 });

    applyInitialFontScale();

    expect(appliedScale()).toBe('1');
  });

  it('셸 주입이 아직 없으면 저장하지 않는다 — 늦게 온 기기 배율로 다시 정할 수 있게', () => {
    applyInitialFontScale();

    expect(localStorage.getItem('landit-font-scale')).toBeNull();
    expect(appliedScale()).toBe('');
  });

  it('브릿지 9 이하 셸이면 저장값이 있어도 적용하지 않는다', () => {
    localStorage.setItem('landit-font-scale', '1.3');
    shell({ bridgeVersion: 9 });

    applyInitialFontScale();

    expect(appliedScale()).toBe('');
  });

  it('저장소를 못 읽어도 터지지 않는다', () => {
    shell({ fontScale: 1 });
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    try {
      expect(() => applyInitialFontScale()).not.toThrow();
    } finally {
      getItem.mockRestore();
    }
  });
});

describe('fontScaleScript', () => {
  // 인라인 스크립트는 모듈 밖에서 문자열로 실행된다 — 바깥 변수를 참조하면 거기서 터진다
  it('문자열만으로 실행돼 같은 단계를 적용한다', () => {
    shell({ fontScale: 1.3 });

    new Function(fontScaleScript)();

    expect(appliedScale()).toBe('1.3');
  });
});

describe('setFontScale', () => {
  it('고른 단계를 저장하고 바로 적용한다 — 보통도 저장해 기기 배율로 되돌아가지 않게', () => {
    setFontScale(1);

    expect(localStorage.getItem('landit-font-scale')).toBe('1');
    expect(appliedScale()).toBe('1');
    expect(getFontScale()).toBe(1);
  });

  it('목록에 없는 단계는 무시한다', () => {
    setFontScale(1.15);

    setFontScale(2 as FontScale);

    expect(getFontScale()).toBe(1.15);
  });

  it('바뀔 때마다 구독자에게 알리고, 구독을 풀면 더는 부르지 않는다', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeFontScale(onChange);

    setFontScale(1.3);
    expect(onChange).toHaveBeenCalledTimes(1);

    unsubscribe();
    setFontScale(0.85);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('getFontScale', () => {
  it('저장값이 없으면 보통이다', () => {
    expect(getFontScale()).toBe(1);
  });
});

describe('isFontScaleAvailable', () => {
  it('브라우저(셸 밖)에서는 쓸 수 있다', () => {
    expect(isFontScaleAvailable(null)).toBe(true);
  });

  it('브릿지 10 셸에서는 쓸 수 있다', () => {
    expect(
      isFontScaleAvailable({
        platform: 'android',
        appVersion: '1.6.0',
        buildNumber: '1',
        bridgeVersion: 10,
      }),
    ).toBe(true);
  });

  it('브릿지 9 이하 셸에서는 쓸 수 없다 — Android 자동 확대가 남아 있어 배율이 겹친다', () => {
    expect(
      isFontScaleAvailable({
        platform: 'android',
        appVersion: '1.5.0',
        buildNumber: '1',
        bridgeVersion: 9,
      }),
    ).toBe(false);
  });
});
