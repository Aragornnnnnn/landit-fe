// 스토어 이동 대상 결정 — 스토어 스킴은 구버전 셸에서도 웹뷰 대신 스토어 앱을 연다
import { describe, expect, it } from 'vitest';

import { resolveStoreTarget } from './resolveStoreTarget';

describe('resolveStoreTarget', () => {
  it('Android면 market 스킴으로 플레이 스토어 앱을 연다', () => {
    // 웹뷰는 http(s) 밖 스킴을 OS로 넘기므로, 웹뷰 안에서 스토어 웹이 열리지 않는다
    expect(resolveStoreTarget('android')).toEqual({
      url: 'market://details?id=com.saynow.app',
      store: 'play_store',
    });
  });

  it('iOS면 itms-apps 스킴으로 앱스토어 앱을 연다', () => {
    expect(resolveStoreTarget('ios')).toEqual({
      url: 'itms-apps://apps.apple.com/kr/app/id6787414201',
      store: 'app_store',
    });
  });
});
