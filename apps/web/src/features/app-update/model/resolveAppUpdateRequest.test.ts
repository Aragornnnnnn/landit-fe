// resolveAppUpdateRequest — 브라우저·형식이 어긋난 버전명을 건너뛰고, platform 표기를 BE 계약(대문자)으로 바꾸는지 검증
import type { NativeContext } from '@landit/bridge';
import { describe, expect, it } from 'vitest';

import { resolveAppUpdateRequest } from './resolveAppUpdateRequest';

const fakeContext = (
  overrides: Partial<NativeContext> = {},
): NativeContext => ({
  platform: 'ios',
  appVersion: '1.0.0',
  buildNumber: '18',
  bridgeVersion: 1,
  ...overrides,
});

describe('resolveAppUpdateRequest', () => {
  it('브라우저면 네이티브 컨텍스트가 있어도 요청을 만들지 않는다', () => {
    expect(resolveAppUpdateRequest('browser', fakeContext())).toBeNull();
  });

  it('앱이지만 네이티브 컨텍스트가 없으면 요청을 만들지 않는다', () => {
    expect(resolveAppUpdateRequest('app', null)).toBeNull();
  });

  // 이미 스토어에 나간 안드로이드 셸은 versionCode를 못 실어 buildNumber가 null이다.
  // 판단은 versionName으로 하니 여기서 거르면 그 유저들만 영영 업데이트 안내를 못 받는다
  it('buildNumber가 없는 셸이어도 versionName만 있으면 요청을 만든다', () => {
    expect(
      resolveAppUpdateRequest('app', fakeContext({ buildNumber: null })),
    ).toEqual({ platform: 'IOS', versionName: '1.0.0' });
  });

  it.each(['1.0', '1.0.0-beta', 'v1.0.0'])(
    'appVersion이 Major.Minor.Patch 형식이 아니면(%s) 요청을 만들지 않는다',
    (appVersion) => {
      expect(
        resolveAppUpdateRequest('app', fakeContext({ appVersion })),
      ).toBeNull();
    },
  );

  it.each([
    ['ios', 'IOS'],
    ['android', 'ANDROID'],
  ] as const)(
    '앱이고 유효한 컨텍스트면 platform을 %s에서 %s로 바꿔 요청을 만든다',
    (platform, expected) => {
      expect(resolveAppUpdateRequest('app', fakeContext({ platform }))).toEqual(
        { platform: expected, versionName: '1.0.0' },
      );
    },
  );
});
