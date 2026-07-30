// resolveAppUpdateRequest — 브라우저·구버전 셸을 건너뛰고, platform 표기를 BE 계약(대문자)으로 바꾸는지 검증
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

  it('앱인데 buildNumber가 없는 구버전 셸이면 요청을 만들지 않는다', () => {
    expect(
      resolveAppUpdateRequest('app', fakeContext({ buildNumber: null })),
    ).toBeNull();
  });

  it.each([
    ['ios', 'IOS'],
    ['android', 'ANDROID'],
  ] as const)(
    '앱이고 유효한 컨텍스트면 platform을 %s에서 %s로 바꿔 요청을 만든다',
    (platform, expected) => {
      expect(resolveAppUpdateRequest('app', fakeContext({ platform }))).toEqual(
        { platform: expected, buildNumber: 18 },
      );
    },
  );
});
