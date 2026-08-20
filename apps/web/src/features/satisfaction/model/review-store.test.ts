// review-store — 리뷰 남기러 가기가 어느 스토어의 어떤 주소를 여는지 (앱 셸이면 스토어 앱, 브라우저면 웹)
import { describe, expect, it } from 'vitest';

import { resolveReviewStore } from './review-store';

describe('resolveReviewStore', () => {
  it('iOS 앱이면 앱스토어 앱의 리뷰 작성 화면을 연다', () => {
    expect(resolveReviewStore('ios', '')).toEqual({
      url: 'itms-apps://apps.apple.com/kr/app/id6787414201?action=write-review',
      store: 'app_store',
    });
  });

  it('Android 앱이면 플레이 스토어 앱의 상세로 연다 — 플레이는 리뷰 작성 딥링크가 없다', () => {
    expect(resolveReviewStore('android', '')).toEqual({
      url: 'market://details?id=com.saynow.app',
      store: 'play_store',
    });
  });

  it('브라우저면 UA로 가른다 — Android 브라우저는 플레이 웹', () => {
    expect(
      resolveReviewStore(null, 'Mozilla/5.0 (Linux; Android 14) Chrome'),
    ).toEqual({
      url: 'https://play.google.com/store/apps/details?id=com.saynow.app',
      store: 'play_store',
    });
  });

  it('브라우저에서 Android가 아니면 앱스토어 웹의 리뷰 작성 화면', () => {
    expect(resolveReviewStore(null, 'Mozilla/5.0 (iPhone) Safari')).toEqual({
      url: 'https://apps.apple.com/kr/app/id6787414201?action=write-review',
      store: 'app_store',
    });
  });
});
