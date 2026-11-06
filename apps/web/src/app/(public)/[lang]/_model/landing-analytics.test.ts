// 랜딩 계측 규칙 — 주소에서 화면·언어를 읽고, 다운로드 링크에서 자리·스토어를 읽고, 머문 시간을 초로 셈
import { describe, expect, it } from 'vitest';

import {
  downloadClickOf,
  dwellSeconds,
  landingPageOf,
} from './landing-analytics';

describe('landingPageOf', () => {
  it('언어 주소 자체는 소개 화면이다', () => {
    expect(landingPageOf('/ko')).toEqual({ page: 'home', language: 'ko' });
    expect(landingPageOf('/ja/')).toEqual({ page: 'home', language: 'ja' });
  });

  it('업데이트 기록과 웹 약관을 화면 이름으로 가른다', () => {
    expect(landingPageOf('/ko/updates')).toEqual({
      page: 'updates',
      language: 'ko',
    });
    expect(landingPageOf('/ja/terms')).toEqual({
      page: 'terms',
      language: 'ja',
    });
    expect(landingPageOf('/ko/privacy')).toEqual({
      page: 'privacy',
      language: 'ko',
    });
  });

  it('랜딩이 아닌 주소는 계측하지 않는다', () => {
    expect(landingPageOf('/scenario')).toBeNull();
    expect(landingPageOf('/ko/unknown')).toBeNull();
  });
});

describe('downloadClickOf', () => {
  it('스토어 배지는 고른 스토어를 함께 남긴다', () => {
    // Given 태블릿 이상의 Google Play 배지 링크
    const href =
      '/download?utm_source=landing&utm_campaign=landing_cta&store=play_store';

    // When
    const click = downloadClickOf(href, 'hero');

    // Then
    expect(click).toEqual({ placement: 'hero', store: 'play_store' });
  });

  it('휴대폰 버튼은 기기로 스토어를 고르므로 스토어를 남기지 않는다', () => {
    const click = downloadClickOf(
      '/download?utm_source=landing&utm_campaign=landing_cta',
      'closing',
    );

    expect(click).toEqual({ placement: 'closing' });
  });

  it('다운로드 링크가 아니거나 자리를 모르면 남기지 않는다', () => {
    expect(downloadClickOf('/ko/terms', 'hero')).toBeNull();
    expect(downloadClickOf('/download', null)).toBeNull();
  });
});

describe('dwellSeconds', () => {
  it('연 시각부터 지금까지를 반올림한 초로 센다', () => {
    expect(dwellSeconds(1_000, 13_600)).toBe(13);
  });

  it('시계가 거꾸로 가도 음수를 남기지 않는다', () => {
    expect(dwellSeconds(5_000, 4_000)).toBe(0);
  });
});
