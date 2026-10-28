// 네이티브 컨텍스트 조립 — expo-application/Platform에서 만든 값이 브릿지 스키마를 만족하는지
import { PixelRatio } from 'react-native';
import { readNativeContext } from '@landit/bridge';
import * as Application from 'expo-application';

import { getDeviceId } from './deviceId';
import { getNativeContext } from './nativeContext';

jest.mock('./deviceId', () => ({ getDeviceId: jest.fn() }));
jest.mock('@/i18n/shell-locale', () => ({
  deviceLanguageTags: () => ['en-US', 'ja-JP'],
}));

describe('getNativeContext', () => {
  it('브릿지 스키마를 만족하는 컨텍스트를 만든다', () => {
    const context = getNativeContext();

    // 셸이 만든 값을 웹 리더가 그대로 받아들여야 한다 (계약 일치)
    expect(readNativeContext(context)).toEqual(context);
  });

  it('기기 선호 언어 목록을 우선순위 그대로 채운다', () => {
    expect(getNativeContext().languages).toEqual(['en-US', 'ja-JP']);
  });

  it('플랫폼·앱 버전을 채운다', () => {
    const context = getNativeContext();

    expect(['ios', 'android']).toContain(context.platform);
    expect(context.appVersion.length).toBeGreaterThan(0);
  });

  // app.json이 아니라 바이너리에 박힌 번호를 읽어야 한다 — EAS가 빌드 때 매기는 번호는
  // app.json에 남지 않아서, 선언값을 읽으면 안드로이드는 null이고 iOS는 옛 번호가 나간다
  it('빌드 번호를 바이너리에서 읽는다', () => {
    jest.replaceProperty(Application, 'nativeBuildVersion', '42');

    expect(getNativeContext().buildNumber).toBe('42');
  });

  it('기기 글자 배율을 채운다', () => {
    jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.3);

    expect(getNativeContext().fontScale).toBe(1.3);
  });

  it('기기 ID를 채운다', () => {
    jest.mocked(getDeviceId).mockReturnValue('device-1');

    expect(getNativeContext().deviceId).toBe('device-1');
  });

  it('기기 ID를 못 읽어도 스키마를 만족한다', () => {
    jest.mocked(getDeviceId).mockReturnValue(undefined);
    const context = getNativeContext();

    expect(context.deviceId).toBeUndefined();
    expect(readNativeContext(context)).toEqual(context);
  });

  it('바이너리에서 빌드 번호를 못 읽으면 null로 둔다', () => {
    jest.replaceProperty(Application, 'nativeBuildVersion', null);

    expect(getNativeContext().buildNumber).toBeNull();
  });
});
