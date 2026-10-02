// 셸 inset 주입 스크립트 — Android에서만 만들고 iOS는 건너뛰는 갈림길을 검증한다
import { Platform } from 'react-native';
import { NATIVE_INSET_VARS } from '@landit/bridge';

import { getNativeInsetsScript } from './nativeInsets';

const insets = { top: 24, bottom: 48, left: 0, right: 0 };

describe('getNativeInsetsScript', () => {
  it('Android면 inset을 담은 주입 스크립트를 만든다', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    expect(getNativeInsetsScript(insets)).toContain(NATIVE_INSET_VARS.bottom);
  });

  it('iOS면 주입하지 않는다', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');

    expect(getNativeInsetsScript(insets)).toBeNull();
  });
});
