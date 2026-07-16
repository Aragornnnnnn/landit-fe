// 네이티브 컨텍스트 조립 — expo-constants/Platform에서 만든 값이 브릿지 스키마를 만족하는지
import { readNativeContext } from '@landit/bridge';

import { getNativeContext } from './nativeContext';

describe('getNativeContext', () => {
  it('브릿지 스키마를 만족하는 컨텍스트를 만든다', () => {
    const context = getNativeContext();

    // 셸이 만든 값을 웹 리더가 그대로 받아들여야 한다 (계약 일치)
    expect(readNativeContext(context)).toEqual(context);
  });

  it('플랫폼·앱 버전을 채운다', () => {
    const context = getNativeContext();

    expect(['ios', 'android']).toContain(context.platform);
    expect(context.appVersion.length).toBeGreaterThan(0);
  });
});
