// resolveStorePlatform — BE 결제 스토어가 셸 플랫폼보다 우선한다
import { describe, expect, it } from 'vitest';

import { resolveStorePlatform } from './store-links';

describe('resolveStorePlatform', () => {
  it('BE 결제 스토어가 있으면 셸 플랫폼과 달라도 그쪽을 쓴다', () => {
    expect(resolveStorePlatform('APP_STORE', 'android')).toBe('ios');
    expect(resolveStorePlatform('MAC_APP_STORE', 'android')).toBe('ios');
    expect(resolveStorePlatform('PLAY_STORE', 'ios')).toBe('android');
  });

  it('스토어를 모르거나 애플·구글이 아니면 셸 플랫폼으로', () => {
    expect(resolveStorePlatform(null, 'android')).toBe('android');
    expect(resolveStorePlatform(undefined, 'android')).toBe('android');
    expect(resolveStorePlatform('PROMOTIONAL', 'android')).toBe('android');
  });

  it('둘 다 없는 브라우저는 iOS 링크다', () => {
    expect(resolveStorePlatform(null, null)).toBe('ios');
  });
});
